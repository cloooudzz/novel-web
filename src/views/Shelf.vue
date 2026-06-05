<template>
  <div class="shelf">
    <div class="shelf-header">
      <h2 class="title">我的书架</h2>
      <span class="book-count" v-if="!loading && shelfList.length > 0">
        共 {{ shelfList.length }} 本藏书
      </span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 未登录状态 -->
    <div v-else-if="!isLogin" class="empty-box">
      <el-empty description="请先登录查看书架">
        <el-button type="primary" @click="$router.push('/login')">
          立即登录
        </el-button>
      </el-empty>
    </div>

    <!-- 书架为空 -->
    <div v-else-if="shelfList.length === 0" class="empty-box">
      <el-empty description="书架空空如也">
        <el-button type="primary" @click="$router.push('/bookstore')">
          去书城逛逛
        </el-button>
      </el-empty>
    </div>

    <!-- 书架列表 -->
    <div v-else class="shelf-list">
      <div 
        class="shelf-item" 
        v-for="item in shelfList" 
        :key="item.bookshelfId"
      >
        <div class="item-main" @click="goToDetail(item.novelId)">
          <img 
            :src="getCoverUrl(item.cover)" 
            class="cover" 
            @error="handleImageError"
          />
          <div class="info">
            <h3 class="novel-title">{{ item.novelTitle }}</h3>
            <p class="author">{{ item.author }}</p>
            <p class="intro">{{ truncateText(item.intro, 60) }}</p>
            <div class="meta">
              <el-tag 
                size="small" 
                :type="item.status === 1 ? 'success' : 'info'"
              >
                {{ item.status === 1 ? '连载中' : '已完结' }}
              </el-tag>
              <span class="chapter-info">
                共 {{ item.totalChapters || 0 }} 章
              </span>
            </div>
          </div>
        </div>
        
        <div class="item-footer">
          <div class="progress-info" v-if="item.lastReadChapterNum">
            <span class="progress-text">
              上次看到：第{{ item.lastReadChapterNum }}章
            </span>
            <span class="read-time" v-if="item.lastReadTime">
              {{ formatTime(item.lastReadTime) }}
            </span>
          </div>
          <div class="progress-info" v-else>
            <span class="progress-text">未开始阅读</span>
            <span class="read-time">{{ formatTime(item.addTime) }} 加入</span>
          </div>
          <div class="actions">
            <el-button 
              size="small" 
              type="primary" 
              @click="continueRead(item)"
            >
              {{ item.lastReadChapterNum ? '继续阅读' : '开始阅读' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              plain
              @click="removeFromShelf(item)"
            >
              移除
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const shelfList = ref([])

// 检查登录状态
const isLogin = computed(() => !!localStorage.getItem('userId'))

// 获取封面URL
const getCoverUrl = (cover) => {
  if (!cover || cover === 'null' || cover === 'undefined') {
    return 'https://picsum.photos/id/111/200/300'
  }
  if (cover.startsWith('http://') || cover.startsWith('https://')) {
    return cover
  }
  if (cover.startsWith('/')) {
    return `http://localhost:8080${cover}`
  }
  return 'https://picsum.photos/id/111/200/300'
}

// 图片加载失败处理
const handleImageError = (e) => {
  e.target.src = 'https://picsum.photos/id/111/200/300'
}

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return '暂无简介'
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit' 
  }).replace(/\//g, '/')
}

// 获取书架列表
const fetchShelfList = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) return

  loading.value = true
  try {
    const res = await request.get('/bookshelf/list')
    
    if (res.code === 200) {
      shelfList.value = res.data || []
      console.log('书架数据:', shelfList.value)
    }
  } catch (error) {
    console.error('获取书架失败:', error)
    ElMessage.error('获取书架数据失败')
  } finally {
    loading.value = false
  }
}

// 跳转到详情页
const goToDetail = (novelId) => {
  router.push(`/novelDetail/${novelId}`)
}

// 继续阅读

const continueRead = async (item) => {
  const chapterNum = item.lastReadChapterNum || 1
  
  // 记录阅读行为
  const userId = localStorage.getItem('userId')
  if (userId) {
    try {
      await request.post('/recommend/behavior', {
        novelId: item.novelId,
        behaviorType: 'read_chapter'
      })
    } catch (e) {
      console.error('记录行为失败:', e)
    }
  }
  
  router.push(`/read/${item.novelId}/${chapterNum}`)
}

// 从书架移除
const removeFromShelf = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定将《${item.novelTitle}》从书架中移除吗？`,
      '移除确认',
      {
        confirmButtonText: '确定移除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  const userId = localStorage.getItem('userId')
  if (!userId) return

  try {
    const res = await request.delete('/bookshelf/remove', {
      params: { novelId: item.novelId }
    })
    
    if (res.code === 200) {
      ElMessage.success('已从书架移除')
      shelfList.value = shelfList.value.filter(
        b => b.bookshelfId !== item.bookshelfId
      )
    } else {
      ElMessage.error(res.msg || '移除失败')
    }
  } catch (error) {
    console.error('移除失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

onMounted(() => {
  fetchShelfList()
})
</script>

<style scoped>
.shelf {
  padding: 20px 0;
}

.shelf-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  margin: 0;
  color: #303133;
}

.book-count {
  color: #909399;
  font-size: 14px;
}

.loading-container {
  padding: 40px 0;
}

.empty-box {
  padding: 80px 0;
  text-align: center;
}

.shelf-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shelf-item {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;
}

.shelf-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.item-main {
  display: flex;
  gap: 20px;
  cursor: pointer;
}

.cover {
  width: 100px;
  height: 130px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  background: #f5f7fa;
}

.info {
  flex: 1;
  min-width: 0;
}

.novel-title {
  font-size: 18px;
  margin: 0 0 8px;
  color: #303133;
}

.author {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px;
}

.intro {
  font-size: 13px;
  color: #606266;
  margin: 0 0 10px;
  line-height: 1.5;
}

.meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chapter-info {
  font-size: 13px;
  color: #909399;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  font-size: 14px;
  color: #409eff;
}

.read-time {
  font-size: 13px;
  color: #c0c4cc;
}

.actions {
  display: flex;
  gap: 10px;
}

/* 响应式 */
@media (max-width: 480px) {
  .intro{
    display: none;
  }
}
</style>