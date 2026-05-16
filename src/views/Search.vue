
<template>
  <div class="search-page">
    <!-- 返回按钮和标题区域 -->
    <div class="page-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2 class="title">搜索小说</h2>
      <div class="placeholder"></div>
    </div>

    <!-- 搜索框 -->
    <div class="search-bar">
      <el-input 
        v-model="searchText" 
        placeholder="输入书名或作者" 
        size="large"
        clearable
        @keyup.enter="doSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" size="large" @click="doSearch" :loading="loading">
        搜索
      </el-button>
    </div>

    <!-- 搜索结果信息 -->
    <div v-if="searched" class="search-info">
      搜索"<span class="keyword-text">{{ keyword }}</span>"，共找到 
      <span class="count">{{ novelList.length }}</span> 本小说
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 搜索结果列表 - 每行一个，占满整行，横线分隔 -->
    <div v-else-if="searched" class="search-result">
      <div v-if="novelList.length > 0" class="novel-list">
        <div 
          v-for="item in novelList" 
          :key="item.id"
        >
          <!-- 顶部横线 -->
          <div class="divider"></div>
          
          <div 
            class="novel-item"
            @click="goToDetail(item.id)"
          >
            <div class="item-left">
              <img 
                :src="getCoverUrl(item.cover)" 
                class="item-cover" 
                @error="handleImageError" 
              />
              <div class="item-info">
                <h3 class="novel-title">{{ item.title }}</h3>
                <p class="author">{{ item.author || '佚名' }}</p>
                <div class="tags">
                  <el-tag 
                    size="small" 
                    :type="item.status === 1 ? 'success' : 'info'"
                  >
                    {{ item.status === 1 ? '连载' : '完结' }}
                  </el-tag>
                  <span class="view-count">{{ formatNumber(item.viewCount || 0) }} 阅读</span>
                </div>
              </div>
            </div>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </div>
        </div>
        <!-- 底部横线 -->
        <div class="divider"></div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="未找到相关小说" />
    </div>
    
    <!-- 未搜索时的提示 -->
    <el-empty v-else description="请输入关键词搜索小说" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const searched = ref(false)
const searchText = ref('')
const keyword = ref('')
const novelList = ref([])

// 返回上一页
const goBack = () => {
  router.push('/')
}

// 处理封面图片URL
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

// 执行搜索
const doSearch = () => {
  const kw = searchText.value.trim()
  if (!kw) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push({ path: '/search', query: { keyword: kw } })
}

// 请求搜索API
const fetchSearchResult = async (kw) => {
  if (!kw) return
  
  loading.value = true
  searched.value = true
  keyword.value = kw
  searchText.value = kw
  novelList.value = []

  try {
    console.log('开始搜索:', kw)
    const res = await request.get('/novel/search', { 
      params: { keyword: kw } 
    })
    console.log('搜索响应:', res)

    if (res.code === 200) {
      novelList.value = res.data || []
      if (novelList.value.length === 0) {
        ElMessage.info('未找到相关小说')
      } else {
        ElMessage.success(`找到 ${novelList.value.length} 本小说`)
      }
    } else {
      ElMessage.warning(res.msg || '搜索失败')
      novelList.value = []
    }
  } catch (error) {
    console.error('搜索请求失败:', error)
    ElMessage.error('搜索失败，请检查网络连接')
    novelList.value = []
  } finally {
    loading.value = false
  }
}

// 监听路由query变化
watch(
  () => route.query.keyword,
  (newKeyword) => {
    if (newKeyword) {
      fetchSearchResult(newKeyword)
    }
  },
  { immediate: false }
)

// 初始化：如果URL带keyword参数，直接搜索
onMounted(() => {
  const kw = route.query.keyword
  if (kw) {
    fetchSearchResult(kw)
  }
})
</script>

<style scoped>
.search-page {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

/* 页面头部 - 返回按钮 + 标题 */
.page-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 5px 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 16px;
  color: #606266;
  padding: 8px 16px;
  transition: all 0.3s;
}

.back-btn:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 22px;
  margin: 0;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
}

.placeholder {
  width: 80px;
  visibility: hidden;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.search-bar .el-input {
  flex: 1;
}

.search-info {
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.keyword-text {
  color: #409eff;
  font-weight: bold;
}

.count {
  color: #67c23a;
  font-weight: bold;
  margin: 0 4px;
}

.loading-container {
  padding: 40px 0;
}

.search-result {
  margin: 20px -20px 0;
}

/* ========== 目录样式 - 每行一个，占满整行 ========== */
.novel-list {
  width: 100%;
}

/* 横线分隔 */
.divider {
  width: 80%;
  margin: 0 auto;
  height: 1px;
  background: #ebeef5;
}

/* 每个小说项 - 占满整行 */
.novel-item {
  width: 80%;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.2s;
  box-sizing: border-box;
}

.novel-item:hover {
  background-color: #f5f7fa;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

/* 封面小图 */
.item-cover {
  width: 56px;
  height: 76px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f7fa;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* 信息区 */
.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 标题 */
.novel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 作者 */
.author {
  font-size: 13px;
  color: #909399;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 标签行 */
.tags {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-count {
  font-size: 12px;
  color: #c0c4cc;
}

/* 右侧箭头 */
.arrow {
  font-size: 16px;
  color: #c0c4cc;
  flex-shrink: 0;
  margin-left: 12px;
  transition: all 0.2s;
}

.novel-item:hover .arrow {
  transform: translateX(4px);
  color: #409eff;
}

/* 响应式 */
@media (max-width: 768px) {
  .search-page {
    padding: 12px;
  }

  .search-result {
    margin: 20px -12px 0;
  }

  .novel-item {
    padding: 14px 12px;
  }

  .item-cover {
    width: 48px;
    height: 64px;
  }

  .item-left {
    gap: 10px;
  }

  .novel-title {
    font-size: 14px;
  }

  .author {
    font-size: 12px;
  }

  .title {
    font-size: 18px;
    position: static;
    transform: none;
    margin-left: auto;
    margin-right: auto;
  }

  .back-btn {
    padding: 6px 12px;
  }

  .placeholder {
    display: none;
  }

  .page-header {
    justify-content: flex-start;
    gap: 15px;
  }
}
</style>
[/content]