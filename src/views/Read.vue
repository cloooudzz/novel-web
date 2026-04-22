<template>
  <div class="read-page" v-loading="loading">
    <!-- 顶部工具栏 -->
    <div class="read-toolbar">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <div class="toolbar-center">
        <h3>{{ novelTitle }}</h3>
        <span class="chapter-info">{{ chapterTitle }}</span>
      </div>
      <div class="toolbar-right">
        <el-button-group>
          <el-button @click="goPrevChapter" :disabled="!prevChapterNum">
            <el-icon><ArrowUp /></el-icon> 上一章
          </el-button>
          <el-button @click="goNextChapter" :disabled="!nextChapterNum">
            下一章 <el-icon><ArrowDown /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 章节内容 -->
    <div class="content-wrapper" v-if="!loading && content">
      <h1 class="chapter-title">{{ chapterTitle }}</h1>
      <div class="content" v-html="formattedContent"></div>
    </div>

    <!-- 章节导航 -->
    <div class="chapter-nav" v-if="!loading">
      <div class="nav-item prev" @click="goPrevChapter" v-if="prevChapterNum">
        <span class="nav-label">上一章</span>
        <span class="nav-title">{{ prevChapterTitle }}</span>
      </div>
      <div class="nav-center">
        <el-select 
          v-model="selectedChapter" 
          placeholder="选择章节" 
          filterable
          @change="jumpToChapter"
          style="width: 200px;"
        >
          <el-option
            v-for="chap in chapterList"
            :key="chap.chapterNum"
            :label="chap.title"
            :value="chap.chapterNum"
          />
        </el-select>
      </div>
      <div class="nav-item next" @click="goNextChapter" v-if="nextChapterNum">
        <span class="nav-label">下一章</span>
        <span class="nav-title">{{ nextChapterTitle }}</span>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="read-bottom">
      <el-button @click="goPrevChapter" :disabled="!prevChapterNum" size="large">
        上一章
      </el-button>
      <el-button type="primary" @click="goNextChapter" :disabled="!nextChapterNum" size="large">
        下一章
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const novelId = ref(Number(route.params.novelId))
const chapterNum = ref(Number(route.params.chapterId))

const loading = ref(false)
const novelTitle = ref('')
const chapterTitle = ref('')
const content = ref('')
const totalChapters = ref(0)
const prevChapterNum = ref(null)
const prevChapterTitle = ref('')
const nextChapterNum = ref(null)
const nextChapterTitle = ref('')

// 章节列表（用于下拉选择）
const chapterList = ref([])
const selectedChapter = ref(null)

// 格式化内容（处理段落）
const formattedContent = computed(() => {
  if (!content.value) return ''
  
  // 将内容按换行分割，每个段落包裹在<p>标签中
  const paragraphs = content.value.split('\n').filter(p => p.trim())
  return paragraphs.map(p => `<p>${p.trim()}</p>`).join('')
})

// 获取章节内容
const fetchChapterContent = async () => {
  loading.value = true
  
  try {
    console.log(`获取章节: novelId=${novelId.value}, chapterNum=${chapterNum.value}`)
    
    const userId = localStorage.getItem('userId')
    const params = {
      novelId: novelId.value,
      chapterNum: chapterNum.value
    }
    
    // 如果已登录，传递userId以更新阅读进度
    if (userId) {
      params.userId = Number(userId)
    }
    
    const res = await request.get('/novel/chapter/detail', { params })
    
    console.log('章节响应:', res)
    
    if (res.code === 200 && res.data) {
      const data = res.data
      novelTitle.value = data.novelTitle || `小说${novelId.value}`
      chapterTitle.value = data.title || `第${chapterNum.value}章`
      content.value = data.content || '暂无内容'
      totalChapters.value = data.totalChapters || 0
      
      prevChapterNum.value = data.prevChapterNum || null
      prevChapterTitle.value = data.prevChapterTitle || ''
      
      nextChapterNum.value = data.nextChapterNum || null
      nextChapterTitle.value = data.nextChapterTitle || ''
      
      // 更新选中章节
      selectedChapter.value = chapterNum.value
      
      // 滚动到顶部
      window.scrollTo(0, 0)
      
      // 额外更新阅读进度（确保记录到书架）
      if (userId) {
        updateReadProgress()
      }
    } else {
      ElMessage.error(res.msg || '获取章节失败')
      useMockContent()
    }
  } catch (error) {
    console.error('获取章节失败:', error)
    useMockContent()
  } finally {
    loading.value = false
  }
}

// 更新阅读进度
const updateReadProgress = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) return
  
  try {
    await request.post('/bookshelf/progress', {
      userId: Number(userId),
      novelId: novelId.value,
      chapterNum: chapterNum.value
    })
    console.log(`阅读进度已更新: 小说${novelId.value}, 第${chapterNum.value}章`)
  } catch (error) {
    console.error('更新阅读进度失败:', error)
  }
}

// 使用模拟内容
const useMockContent = () => {
  const mockTitles = [
    '初入江湖', '奇遇连连', '突破瓶颈', '名动一方', 
    '巅峰对决', '新的征程', '风云再起', '绝境求生',
    '浴火重生', '王者归来', '终极一战', '新的开始'
  ]
  const index = (chapterNum.value - 1) % mockTitles.length
  
  novelTitle.value = `小说${novelId.value}`
  chapterTitle.value = `第${chapterNum.value}章 ${mockTitles[index]}`
  
  const mockParagraphs = [
    '这是一个充满传奇色彩的世界。强者为尊，弱肉强食。',
    '少年踏上了修炼之路，前路漫漫，充满未知。但他坚信，只要努力，终有一天能登临巅峰。',
    '修炼无岁月，转眼已是数载。这一路走来，经历了太多风雨，也结识了许多志同道合的伙伴。',
    '每一次战斗，都是一次成长。每一次突破，都让他离梦想更近一步。',
    '他曾跌落谷底，也曾站上巅峰。但无论身处何种境地，他从未放弃过心中的信念。',
    '前方的路还很长，挑战依然存在。但他无所畏惧，因为他知道，真正的强者，都是在逆境中成长起来的。',
    '新的征程已经开始，让我们拭目以待，看这位少年如何书写属于他的传奇。'
  ]
  
  const repeatCount = Math.floor(chapterNum.value / 10) + 2
  let fullContent = ''
  for (let i = 0; i < repeatCount; i++) {
    fullContent += mockParagraphs.join('\n\n') + '\n\n'
  }
  content.value = fullContent.trim()
  
  totalChapters.value = Math.max(chapterNum.value + 5, 50)
  prevChapterNum.value = chapterNum.value > 1 ? chapterNum.value - 1 : null
  prevChapterTitle.value = prevChapterNum.value ? `第${prevChapterNum.value}章` : ''
  nextChapterNum.value = chapterNum.value < totalChapters.value ? chapterNum.value + 1 : null
  nextChapterTitle.value = nextChapterNum.value ? `第${nextChapterNum.value}章` : ''
  
  selectedChapter.value = chapterNum.value
}

// 获取章节列表
const fetchChapterList = async () => {
  try {
    const res = await request.get(`/novel/chapters/${novelId.value}`)
    if (res.code === 200 && res.data) {
      chapterList.value = res.data
      if (res.data.length > 0) {
        totalChapters.value = res.data.length
      }
    } else {
      generateMockChapterList()
    }
  } catch (error) {
    console.error('获取章节列表失败:', error)
    generateMockChapterList()
  }
}

// 生成模拟章节列表
const generateMockChapterList = () => {
  const total = totalChapters.value || 50
  const mockTitles = [
    '初入江湖', '奇遇连连', '突破瓶颈', '名动一方', 
    '巅峰对决', '新的征程', '风云再起', '绝境求生',
    '浴火重生', '王者归来', '终极一战', '新的开始'
  ]
  
  chapterList.value = Array.from({ length: total }, (_, i) => {
    const num = i + 1
    const titleIndex = (num - 1) % mockTitles.length
    return {
      id: num,
      chapterNum: num,
      title: `第${num}章 ${mockTitles[titleIndex]}`
    }
  })
}

// 返回
const goBack = () => {
  router.push(`/novelDetail/${novelId.value}`)
}

// 上一章
const goPrevChapter = () => {
  if (prevChapterNum.value) {
    router.push(`/read/${novelId.value}/${prevChapterNum.value}`)
  }
}

// 下一章
const goNextChapter = () => {
  if (nextChapterNum.value) {
    router.push(`/read/${novelId.value}/${nextChapterNum.value}`)
  } else {
    ElMessage.info('已经是最后一章了')
  }
}

// 跳转到指定章节
const jumpToChapter = (num) => {
  if (num && num !== chapterNum.value) {
    router.push(`/read/${novelId.value}/${num}`)
  }
}

// 键盘快捷键
const handleKeydown = (e) => {
  // 左箭头：上一章
  if (e.key === 'ArrowLeft' && prevChapterNum.value) {
    e.preventDefault()
    goPrevChapter()
  }
  // 右箭头：下一章
  if (e.key === 'ArrowRight' && nextChapterNum.value) {
    e.preventDefault()
    goNextChapter()
  }
}

// 监听路由变化
watch(
  () => route.params.chapterId,
  (newId) => {
    if (newId) {
      chapterNum.value = Number(newId)
      fetchChapterContent()
    }
  }
)

onMounted(() => {
  fetchChapterContent()
  fetchChapterList()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.read-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  min-height: 100vh;
  position: relative; /* 确保定位上下文 */
}

.read-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 30px;
  position: sticky;
  top: 0;           /* 改为 0，而不是 65px */
  background: #fff;
  z-index: 1000;    /* 提高层级 */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}


.toolbar-center {
  text-align: center;
}

.toolbar-center h3 {
  margin: 0 0 5px;
  font-size: 18px;
  color: #303133;
}

.chapter-info {
  font-size: 14px;
  color: #909399;
}

.content-wrapper {
  padding: 20px 0;
}

.chapter-title {
  font-size: 28px;
  text-align: center;
  margin-bottom: 40px;
  color: #303133;
  font-weight: 600;
}

.content {
  font-size: 18px;
  line-height: 2;
  color: #333;
  letter-spacing: 0.5px;
  text-align: left;
}

.content :deep(p) {
  margin-bottom: 25px;
  
  word-break: break-word;
  text-align: left;
}

.chapter-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 40px 0;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.nav-item {
  flex: 1;
  cursor: pointer;
  padding: 15px 20px;
  border-radius: 8px;
  transition: all 0.3s;
  max-width: 35%;
}

.nav-item:hover {
  background: #ecf5ff;
}

.nav-item.prev {
  text-align: left;
}

.nav-item.next {
  text-align: right;
}

.nav-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.nav-title {
  display: block;
  font-size: 14px;
  color: #409eff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-center {
  flex-shrink: 0;
}

.read-bottom {
  margin-top: 40px;
  padding: 20px 0;
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .read-toolbar {
    flex-direction: column;
    gap: 15px;
  }
  
  .toolbar-center {
    order: -1;
  }
  
  .chapter-nav {
    flex-direction: column;
    gap: 20px;
  }
  
  .nav-item {
    max-width: 100%;
    width: 100%;
    text-align: center !important;
  }
  
  .content {
    font-size: 16px;
  }
}

/* 深色阅读模式（可选） */
.read-page.dark {
  background: #1a1a1a;
}

.read-page.dark .read-toolbar,
.read-page.dark .content-wrapper {
  background: #1a1a1a;
}

.read-page.dark .chapter-title,
.read-page.dark .content {
  color: #e0e0e0;
}
</style>