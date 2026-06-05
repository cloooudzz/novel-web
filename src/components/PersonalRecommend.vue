<template>
  <div class="personal-recommend">
    <!-- 头部 -->
    <div class="recommend-header">
      <div class="header-left">
        <h3 class="title">
          <el-icon><StarFilled /></el-icon>
          {{ '猜你喜欢' }}
        </h3>
      </div>
      <el-button text @click="refreshRecommend" :loading="loading">
        <el-icon><Refresh /></el-icon> 换一批
      </el-button>
    </div>

    <!-- 用户偏好标签展示 -->
    <div class="preference-tags" v-if="preferences.length > 0 && showTags">
      <span class="tags-label">你的阅读喜好：</span>
      <el-tag 
        v-for="tag in preferences" 
        :key="tag.tagName"
        size="small"
        type="primary"
        effect="plain"
        class="pref-tag"
      >
        {{ tag.tagName }}
        <span class="tag-score">({{ tag.score }})</span>
      </el-tag>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="2" animated />
    </div>

    <!-- 推荐列表 -->
    <div v-else class="recommend-list">
      <div 
        class="recommend-item" 
        v-for="item in recommendList" 
        :key="item.id"
        @click="goToDetail(item.id)"
      >
        <img :src="getCoverUrl(item.cover)" class="cover" @error="handleImageError" />
        <div class="item-info">
          <h4 class="novel-title">{{ item.title }}</h4>
          <p class="author">{{ item.author }}</p>
          <div class="meta">
            <el-tag size="small" :type="item.status === 1 ? 'success' : 'info'">
              {{ item.status === 1 ? '连载中' : '已完结' }}
            </el-tag>
            <span class="view-count">{{ formatNumber(item.viewCount) }} 阅读</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="recommendList.length === 0" description="暂无推荐" :image-size="60" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { StarFilled, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const props = defineProps({
  showTags: {
    type: Boolean,
    default: true
  },
  limit: {
    type: Number,
    default: 8
  }
})

const loading = ref(false)
const recommendList = ref([])
const preferences = ref([])

const isLogin = computed(() => !!localStorage.getItem('userId'))

// 获取封面URL
const getCoverUrl = (cover) => {
  if (!cover) return 'https://picsum.photos/id/111/200/300'
  if (cover.startsWith('http')) return cover
  if (cover.startsWith('/')) return `http://localhost:8080${cover}`
  return 'https://picsum.photos/id/111/200/300'
}

const handleImageError = (e) => {
  e.target.src = 'https://picsum.photos/id/111/200/300'
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  return num.toString()
}

const goToDetail = (novelId) => {
  router.push(`/novelDetail/${novelId}`)
}

// 获取推荐列表
const fetchRecommendations = async () => {
  loading.value = true
  try {
    const userId = localStorage.getItem('userId')
    const params = { limit: props.limit }
    if (userId) params.userId = Number(userId)
    
    const res = await request.get('/recommend/personal', { params })
    
    if (res.code === 200) {
      recommendList.value = res.data || []
    }
  } catch (error) {
    console.error('获取推荐失败:', error)
    recommendList.value = []
  } finally {
    loading.value = false
  }
}

// 获取用户偏好标签
const fetchUserPreferences = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) return
  
  try {
    const res = await request.get('/recommend/preferences', {
      params: { userId: Number(userId) }
    })
    
    if (res.code === 200 && res.data) {
      preferences.value = res.data.slice(0, 6)
    }
  } catch (error) {
    console.error('获取偏好失败:', error)
  }
}

// 刷新推荐
const refreshRecommend = () => {
  fetchRecommendations()
}

// 监听登录状态变化
watch(isLogin, (newVal) => {
  if (newVal) {
    fetchUserPreferences()
  }
  fetchRecommendations()
})

onMounted(() => {
  fetchRecommendations()
  if (isLogin.value) {
    fetchUserPreferences()
  }
})
</script>

<style scoped>
.personal-recommend {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.recommend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  margin: 0;
  color: #303133;
}

.title .el-icon {
  color: #e6a23c;
}

.subtitle {
  font-size: 13px;
  color: #909399;
}

.preference-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.tags-label {
  font-size: 13px;
  color: #606266;
}

.pref-tag {
  cursor: default;
}

.tag-score {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 2px;
}

.loading-container {
  padding: 20px 0;
}

.recommend-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.recommend-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #ebeef5;
}

.recommend-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.recommend-item .cover {
  width: 60px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.novel-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author {
  font-size: 12px;
  color: #909399;
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.view-count {
  font-size: 11px;
  color: #c0c4cc;
}

/* 响应式 */
@media (max-width: 768px) {
  .recommend-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .title {
    font-size: 16px;
  }
  .recommend-item .cover {
    aspect-ratio: 3 / 4;
    width: 55px;
    height: auto;
    object-fit: cover;
    object-position: center;
  }
  .novel-title {
    font-size: 13px;
    margin: 4px 0;
    text-align: center;
  }
 .meta, .view-count {
    display: none;
  }
  .recommend-item {
    padding: 6px;
  }
}

@media (max-width: 480px) {
  .recommend-item .cover {
    aspect-ratio: 3 / 4;
    width: 60px;
    height: auto;
  }
  .novel-title {
    font-size: 12px;
  }
  .recommend-item {
    padding: 4px;
  }
}
</style>