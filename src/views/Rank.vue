<template>
  <div class="rank-page">
    <h2 class="title">热门排行榜</h2>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 排行榜列表 -->
    <div v-else class="rank-list">
      <!-- 加载失败提示 -->
      <el-result 
        v-if="loadError" 
        icon="error" 
        title="加载失败" 
      >
        <template #extra>
          <el-button type="primary" @click="fetchRankList">重新加载</el-button>
        </template>
      </el-result>

      <!-- 正常列表 -->
      <template v-else>
        <div 
          class="rank-item" 
          v-for="(item, index) in rankList" 
          :key="item.id"
          @click="goToDetail(item.id)"
        >
          <div class="rank-left">
            <span class="rank-num" :class="getRankClass(index)">
              {{ index + 1 }}
            </span>
            <img :src="getCoverUrl(item.cover)" class="rank-cover" @error="handleImageError" />
            <div class="rank-info">
              <h3 class="novel-title">{{ item.title }}</h3>
              <p class="novel-author">{{ item.author }}</p>
              <p class="novel-intro">{{ truncateText(item.intro, 60) }}</p>
            </div>
          </div>
          <div class="rank-right">
            <el-tag :type="item.status === 1 ? 'success' : 'info'" size="small">
              {{ item.status === 1 ? '连载中' : '已完结' }}
            </el-tag>
            <span class="view-count">
              <el-icon><View /></el-icon>
              {{ formatNumber(item.viewCount) }}
            </span>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty v-if="rankList.length === 0" description="暂无排行数据" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const loadError = ref(false)
const rankList = ref([])

// 获取排行榜数据
const fetchRankList = async () => {
  loading.value = true
  loadError.value = false
  try {
    const res = await request.get('/novel/rank', { params: { limit: 20 } })
    console.log('排行榜数据:', res)
    
    if (res.code === 200) {
      rankList.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取排行榜失败')
      loadError.value = true
    }
  } catch (error) {
    console.error('获取排行榜失败:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

// 获取封面URL
const getCoverUrl = (cover) => {
  if (!cover) return 'https://picsum.photos/id/111/200/300'
  if (cover.startsWith('http')) return cover
  if (cover.startsWith('/')) return `http://localhost:8080${cover}`
  return 'https://picsum.photos/id/111/200/300'
}

// 图片加载失败处理
const handleImageError = (e) => {
  e.target.src = 'https://picsum.photos/id/111/200/300'
}

// 排名样式
const getRankClass = (index) => {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return '暂无简介'
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

// 格式化数字
const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 跳转详情
const goToDetail = (id) => {
  router.push(`/novelDetail/${id}`)
}

onMounted(() => {
  fetchRankList()
})
</script>

<style scoped>
.rank-page {
  padding: 20px 0;
  max-width: 1000px;
  margin: 0 auto;
}

.title {
  justify-content: center;
  font-size: 24px;
  margin-bottom: 24px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title::before {
  content: '🏆';
  font-size: 28px;
}

.loading-container {
  padding: 40px 0;
}

.rank-list {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 1200px;
}

.rank-item:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  background: #fafbff;
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.rank-num {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #e8e8e8;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
  line-height: 1;
}

/* 前三名特殊样式 */
.rank-num.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 170, 0, 0.3);
}

.rank-num.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #fff;
  box-shadow: 0 2px 8px rgba(160, 160, 160, 0.3);
}

.rank-num.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
  box-shadow: 0 2px 8px rgba(184, 115, 51, 0.3);
}

.rank-cover {
  width: 60px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  background: #f5f7fa;
}

.rank-info {
  min-width: 0;
  flex: 1; 
}

.novel-title {
  font-size: 16px;
  margin: 0 0 6px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.novel-author {
  font-size: 13px;
  color: #909399;
  margin: 0 0 6px;
}

.novel-intro {
  font-size: 13px;
  color: #c0c4cc;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 20px;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.view-count .el-icon {
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .rank-item {
    padding: 12px 16px;
  }
  
  .rank-left {
    gap: 12px;
  }
  
  .rank-cover {
    width: 48px;
    height: 64px;
  }
  
  .novel-intro {
    display: none;
  }
  
  .rank-right {
    margin-left: 12px;
  }
  
  .rank-num {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
}
</style>