<template>
  <div class="read-page" :class="[themeMode, fontStyle]" v-loading="loading">
    <!-- 左侧悬浮目录栏 -->
    <div class="side-catalog" :class="{ collapsed: catalogCollapsed }">
      <!-- 展开状态 -->
      <div v-show="!catalogCollapsed" class="catalog-content">
        <!-- 目录头部：标题和折叠按钮 -->
        <div class="catalog-header">
          <div class="catalog-collapse-btn" @click="catalogCollapsed = true" title="收起目录">
            <el-icon :size="18"><ArrowLeft /></el-icon>
          </div>
          <h4><el-icon><List /></el-icon> 目录</h4>
        </div>
        <!-- 目录列表 -->
        <div class="catalog-list" ref="catalogListRef">
          <div
            v-for="chap in chapterList"
            :key="chap.chapterNum"
            class="catalog-item"
            :class="{ active: chap.chapterNum === chapterNum }"
            @click="jumpToChapter(chap.chapterNum)"
          >
            <span class="catalog-title">{{ chap.title }}</span>
          </div>
        </div>
      </div>
      <!-- 折叠状态：展开按钮 -->
      <div v-show="catalogCollapsed" class="catalog-expand-btn" @click="catalogCollapsed = false" title="展开目录">
        <el-icon :size="20"><List /></el-icon>
      </div>
    </div>

    <!-- 右侧悬浮工具栏 -->
    <div class="side-toolbar" :class="{ collapsed: toolbarCollapsed }">
      <!-- 展开状态 -->
      <div v-show="!toolbarCollapsed" class="toolbar-content">
        <!-- 工具栏头部：标题和折叠按钮 -->
        <div class="toolbar-header">
          <h4><el-icon><Setting /></el-icon> 设置</h4>
          <div class="toolbar-collapse-btn" @click="toolbarCollapsed = true" title="收起设置">
            <el-icon :size="18"><ArrowRight /></el-icon>
          </div>
        </div>
        
        <div class="toolbar-body">
          <div class="tool-section">
            <h4><el-icon><Sunny /></el-icon> 主题模式</h4>
            <div class="theme-buttons">
              <div class="theme-btn" :class="{ active: themeMode === 'light' }" @click="setTheme('light')" title="白天模式">
                <div class="theme-preview light-preview"><span class="preview-text">Aa</span></div>
                <span>白天</span>
              </div>
              <div class="theme-btn" :class="{ active: themeMode === 'warm' }" @click="setTheme('warm')" title="护眼模式">
                <div class="theme-preview warm-preview"><span class="preview-text">Aa</span></div>
                <span>护眼</span>
              </div>
              <div class="theme-btn" :class="{ active: themeMode === 'dark' }" @click="setTheme('dark')" title="夜间模式">
                <div class="theme-preview dark-preview"><span class="preview-text">Aa</span></div>
                <span>夜间</span>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="tool-section">
            <h4><el-icon><ZoomIn /></el-icon> 字体大小</h4>
            <div class="font-size-control">
              <el-button size="small" circle @click="changeFontSize(-1)" :disabled="fontSize <= 14">
                <el-icon><Minus /></el-icon>
              </el-button>
              <span class="font-size-display">{{ fontSize }}px</span>
              <el-button size="small" circle @click="changeFontSize(1)" :disabled="fontSize >= 28">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </div>

          <el-divider />

          <div class="tool-section">
            <h4><el-icon><Edit /></el-icon> 字体样式</h4>
            <div class="font-style-buttons">
              <el-button :type="fontStyle === 'font-song' ? 'primary' : 'default'" size="small" @click="fontStyle = 'font-song'">宋体</el-button>
              <el-button :type="fontStyle === 'font-hei' ? 'primary' : 'default'" size="small" @click="fontStyle = 'font-hei'">黑体</el-button>
              <el-button :type="fontStyle === 'font-kai' ? 'primary' : 'default'" size="small" @click="fontStyle = 'font-kai'">楷体</el-button>
            </div>
          </div>

          <el-divider />

          <div class="tool-section">
            <h4><el-icon><Brush /></el-icon> 字体颜色</h4>
            <div class="color-picker-group">
              <div class="color-item" v-for="color in fontColors" :key="color.value"
                :style="{ backgroundColor: color.value }"
                :class="{ active: fontColor === color.value }"
                @click="fontColor = color.value" :title="color.name"></div>
            </div>
          </div>

          <el-divider />

          <div class="tool-section">
            <h4><el-icon><Tickets /></el-icon> 行间距</h4>
            <div class="font-size-control">
              <el-button size="small" circle @click="changeLineHeight(-0.4)" :disabled="lineHeight <= 1.4">
                <el-icon><Minus /></el-icon>
              </el-button>
              <span class="font-size-display">{{ lineHeight.toFixed(1) }}</span>
              <el-button size="small" circle @click="changeLineHeight(0.4)" :disabled="lineHeight >= 5.0">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </div>

          <el-divider />

          <div class="tool-section">
            <h4><el-icon><Star /></el-icon> 操作</h4>
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="toggleBookshelf" :loading="shelfLoading" style="width: 100%; margin-bottom: 8px;">
                {{ inBookshelf ? '已在书架中' : '加入书架' }}
              </el-button>
            </div>
          </div>

          <el-divider />

          <div class="tool-section">
            <h4><el-icon><Refresh /></el-icon> 重置</h4>
            <el-button size="small" @click="resetSettings" style="width: 100%;">
              <el-icon><Refresh /></el-icon> 恢复默认设置
            </el-button>
          </div>
        </div>
      </div>
      <!-- 折叠状态：展开按钮 -->
      <div v-show="toolbarCollapsed" class="toolbar-expand-btn" @click="toolbarCollapsed = false" title="展开设置">
        <el-icon :size="20"><Setting /></el-icon>
      </div>
    </div>

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
      <div class="content" v-html="formattedContent" :style="contentStyle"></div>
    </div>


    <!-- 评论区 -->
    <CommentSection 
      v-if="!loading && novelId && chapterNum"
      :novelId="novelId" 
      :chapterNum="chapterNum" 
    />

    <!-- 章节导航 -->
    <div class="chapter-nav" v-if="!loading">
      <div class="nav-item prev" @click="goPrevChapter" v-if="prevChapterNum">
        <span class="nav-label">上一章</span>
        <span class="nav-title">{{ prevChapterTitle }}</span>
      </div>
      <div class="nav-item next" @click="goNextChapter" v-if="nextChapterNum">
        <span class="nav-label">下一章</span>
        <span class="nav-title">{{ nextChapterTitle }}</span>
      </div>
    </div>




  </div>

</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, ArrowUp, ArrowDown, Setting,
  Sunny, Moon, Coffee,
  ZoomIn, ZoomOut,
  Edit, Tickets,
  Brush, 
  List,
  Refresh,
  Minus, Plus,
  Star,
  Check,
  ArrowRight
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import CommentSection from '@/components/CommentSection.vue'

const route = useRoute()
const router = useRouter()

const novelId = ref(Number(route.params.novelId))
const chapterNum = ref(Number(route.params.chapterId))

const loading = ref(false)
const shelfLoading = ref(false)
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

// 书架状态
const inBookshelf = ref(false)

// 目录栏折叠状态
const catalogCollapsed = ref(true)

// 工具栏折叠状态
const toolbarCollapsed = ref(false)

// 主题模式：light, warm, dark
const themeMode = ref(localStorage.getItem('readTheme') || 'light')

// 字体大小
const fontSize = ref(Number(localStorage.getItem('readFontSize')) || 18)

// 字体样式：font-song, font-hei, font-kai
const fontStyle = ref(localStorage.getItem('readFontStyle') || 'font-song')

// 字体颜色
const fontColor = ref(localStorage.getItem('readFontColor') || '#333333')

// 行间距
const lineHeight = ref(Number(localStorage.getItem('readLineHeight')) || 2.0)

// 目录列表的 ref
const catalogListRef = ref(null)

// 滚动到当前章节
const scrollToCurrentChapter = () => {
  nextTick(() => {
    if (!catalogListRef.value) return
    
    const activeItem = catalogListRef.value.querySelector('.catalog-item.active')
    if (activeItem) {
      activeItem.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  })
}

// 监听目录折叠状态变化，展开时定位到当前章节
watch(catalogCollapsed, (newVal) => {
  if (!newVal) {
    scrollToCurrentChapter()
  }
})

// 监听章节变化，更新目录位置
watch(chapterNum, () => {
  if (!catalogCollapsed.value) {
    scrollToCurrentChapter()
  }
})

// 可选字体颜色
const fontColors = [
  { name: '默认黑', value: '#333333' },
  { name: '深灰', value: '#555555' },
  { name: '棕色', value: '#8B4513' },
  { name: '深蓝', value: '#1a1a2e' },
  { name: '墨绿', value: '#2d5016' },
  { name: '白色', value: '#e8e8e8' },
]

// 计算内容样式
const contentStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  lineHeight: lineHeight.value,
  color: fontColor.value,
}))

// 格式化内容（处理段落）
const formattedContent = computed(() => {
  if (!content.value) return ''
  
  const paragraphs = content.value.split('\n').filter(p => p.trim())
  return paragraphs.map(p => `<p>${p.trim()}</p>`).join('')
})

// 设置主题
const setTheme = (mode) => {
  themeMode.value = mode
  localStorage.setItem('readTheme', mode)
  
  switch (mode) {
    case 'light':
      fontColor.value = '#333333'
      break
    case 'warm':
      fontColor.value = '#4a4a4a'
      break
    case 'dark':
      fontColor.value = '#cccccc'
      break
  }
  localStorage.setItem('readFontColor', fontColor.value)
  
  updateBodyBackground(mode)
}

// 更新 body 背景色
const updateBodyBackground = (mode) => {
  const body = document.body
  switch (mode) {
    case 'light':
      body.style.backgroundColor = '#fff'
      break
    case 'warm':
      body.style.backgroundColor = '#f5f0e8'
      break
    case 'dark':
      body.style.backgroundColor = '#1a1a1a'
      break
  }
}

// 改变字体大小
const changeFontSize = (delta) => {
  const newSize = fontSize.value + delta
  if (newSize >= 14 && newSize <= 28) {
    fontSize.value = newSize
    localStorage.setItem('readFontSize', newSize)
  }
}

// 改变行间距
const changeLineHeight = (delta) => {
  const newHeight = Math.round((lineHeight.value + delta) * 10) / 10
  if (newHeight >= 1.4 && newHeight <= 5.0) {
    lineHeight.value = newHeight
    localStorage.setItem('readLineHeight', newHeight)
  }
}

// 重置设置
const resetSettings = () => {
  setTheme('light')
  fontSize.value = 18
  localStorage.setItem('readFontSize', '18')
  fontStyle.value = 'font-song'
  localStorage.setItem('readFontStyle', 'font-song')
  fontColor.value = '#333333'
  localStorage.setItem('readFontColor', '#333333')
  lineHeight.value = 2.0
  localStorage.setItem('readLineHeight', '2.0')
  ElMessage.success('已恢复默认设置')
}

// 加入/移出书架
const toggleBookshelf = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  shelfLoading.value = true
  
  if (inBookshelf.value) {
    ElMessage.info('该书已在书架中')
    shelfLoading.value = false
    return
  }
  
  try {
    const res = await request.post('/bookshelf/add', {
      userId: Number(userId),
      novelId: novelId.value
    })
    
    if (res.code === 200) {
      ElMessage.success('已加入书架')
      inBookshelf.value = true
    } else {
      ElMessage.info(res.msg || '已在书架中')
      inBookshelf.value = true
    }
  } catch (error) {
    console.error('加入书架失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    shelfLoading.value = false
  }
}

// 检查书架状态
const checkBookshelfStatus = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) return
  
  try {
    const res = await request.get('/bookshelf/list', {
      params: { userId: Number(userId) }
    })
    
    if (res.code === 200 && res.data) {
      const shelfItem = res.data.find(item => item.novelId == novelId.value)
      inBookshelf.value = !!shelfItem
    }
  } catch (error) {
    console.error('检查书架状态失败:', error)
  }
}

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
      
      selectedChapter.value = chapterNum.value
      
      window.scrollTo(0, 0)
      
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
  if (e.key === 'ArrowLeft' && prevChapterNum.value) {
    e.preventDefault()
    goPrevChapter()
  }
  if (e.key === 'ArrowRight' && nextChapterNum.value) {
    e.preventDefault()
    goNextChapter()
  }
}

// 监听字体颜色变化并保存
watch(fontColor, (newColor) => {
  localStorage.setItem('readFontColor', newColor)
})

// 监听字体样式变化并保存
watch(fontStyle, (newStyle) => {
  localStorage.setItem('readFontStyle', newStyle)
})

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
  checkBookshelfStatus()
  window.addEventListener('keydown', handleKeydown)
  updateBodyBackground(themeMode.value)
  
  if (!catalogCollapsed.value) {
    scrollToCurrentChapter()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.backgroundColor = ''
})
</script>

<style scoped>
/* ========== 基础样式 ========== */
.read-page {
  max-width: 100%;
  margin: 0;
  padding: 20px;
  background: #fff;
  min-height: 100vh;
  position: relative;
  transition: all 0.3s ease;
}

.read-page .content-wrapper,
.read-page .read-toolbar,
.read-page .chapter-nav,
.read-page .read-bottom {
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

/* ========== 左侧悬浮目录栏 ========== */
.side-catalog {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2000;
  background: #fff;
  border-radius: 0 12px 12px 0;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  width: 260px;
  max-height: 80vh;
  overflow: visible;
}

.side-catalog.collapsed {
  width: 44px;
  border-radius: 0 12px 12px 0;
}

/* 目录头部 */
.catalog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 15px 10px;
  border-bottom: 1px solid #ebeef5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
  border-radius: 0 12px 0 0;
}

.catalog-header h4 {
  margin: 0;
  font-size: 15px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 右上角折叠按钮 */
.catalog-collapse-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  color: #909399;
  transition: all 0.2s;
}

.catalog-collapse-btn:hover {
  background: #f0f2f5;
  color: #409eff;
}

/* 折叠状态的展开按钮 */
.catalog-expand-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  background: #409eff;
  border-radius: 0 12px 12px 0;
  transition: all 0.3s;
}

.catalog-expand-btn:hover {
  background: #337ecc;
}

/* 目录内容区域 */
.catalog-content {
  padding: 0;
  max-height: 80vh;
  overflow: hidden;
}

.catalog-list {
  max-height: calc(80vh - 60px);
  overflow-y: auto;
  padding: 10px 15px;
}

.catalog-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 3px solid transparent;
  margin-bottom: 2px;
}

.catalog-item:hover {
  background: #f5f7fa;
  border-left-color: #c0c4cc;
}

.catalog-item.active {
  background: #ecf5ff;
  border-left-color: #409eff;
  color: #409eff;
}

.catalog-item.active .catalog-title {
  color: #409eff;
  font-weight: 600;
}

.catalog-title {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

/* 目录栏滚动条样式 */
.catalog-list::-webkit-scrollbar {
  width: 4px;
}

.catalog-list::-webkit-scrollbar-track {
  background: transparent;
}

.catalog-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.catalog-list::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

/* ========== 右侧悬浮工具栏 ========== */
.side-toolbar {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2000;
  background: #fff;
  border-radius: 12px 0 0 12px;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  width: 260px;
  max-height: 120vh;
  overflow: visible;
}

.side-toolbar.collapsed {
  width: 44px;
  border-radius: 12px 0 0 12px;
}

/* 工具栏头部 */
.toolbar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 15px 10px;
  border-bottom: 1px solid #ebeef5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
  border-radius: 12px 0 0 0;
}

.toolbar-header h4 {
  margin: 0;
  font-size: 15px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 左侧折叠按钮 */
.toolbar-collapse-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  color: #909399;
  transition: all 0.2s;
}

.toolbar-collapse-btn:hover {
  background: #f0f2f5;
  color: #409eff;
}

/* 折叠状态的展开按钮 */
.toolbar-expand-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  background: #409eff;
  border-radius: 12px 0 0 12px;
  transition: all 0.3s;
}

.toolbar-expand-btn:hover {
  background: #337ecc;
}

/* 工具栏内容区域 */
.toolbar-content {
  padding: 0;
  max-height: 120vh;
  overflow: hidden;
}

.toolbar-body {
  max-height: calc(120vh - 60px);
  overflow-y: auto;
  padding: 15px;
}

/* 工具栏滚动条样式 */
.toolbar-body::-webkit-scrollbar {
  width: 4px;
}

.toolbar-body::-webkit-scrollbar-track {
  background: transparent;
}

.toolbar-body::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.toolbar-body::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.tool-section {
  margin-bottom: 10px;
}

.tool-section h4 {
  font-size: 14px;
  margin: 0 0 10px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 5px;
}

.tool-section h4 .el-icon {
  font-size: 16px;
}

/* 主题按钮 */
.theme-buttons {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.theme-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
  border: 2px solid transparent;
  font-size: 12px;
  color: #909399;
  flex: 1;
}

.theme-btn:hover {
  background: #f5f7fa;
}

.theme-btn.active {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.theme-preview {
  width: 40px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
  font-size: 12px;
  font-weight: bold;
}

.light-preview {
  background: #fff;
  color: #333;
}

.warm-preview {
  background: #f5f0e8;
  color: #8B7355;
}

.dark-preview {
  background: #2d2d2d;
  color: #ccc;
}

/* 字体大小控制 */
.font-size-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.font-size-display {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  min-width: 50px;
  text-align: center;
}

/* 字体样式按钮 */
.font-style-buttons {
  display: flex;
  gap: 8px;
}

.font-style-buttons .el-button {
  flex: 1;
}

/* 颜色选择器 */
.color-picker-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-item {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-item:hover {
  transform: scale(1.15);
}

.color-item.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
  transform: scale(1.1);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
}

/* 分割线样式 */
.toolbar-body :deep(.el-divider) {
  margin: 12px 0;
}

/* ========== 主题模式下目录栏的样式 ========== */

/* 白天模式 */
.read-page.light .side-catalog {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
}

/* 护眼模式 */
.read-page.warm .side-catalog,
.read-page.warm .catalog-content {
  background: #f5f0e8 !important;
  border-right: 1px solid #e0d5c0;
}

.read-page.warm .catalog-header {
  background: #f5f0e8 !important;
  border-bottom-color: #e0d5c0;
}

.read-page.warm .catalog-expand-btn {
  background: #8B7355 !important;
}

.read-page.warm .catalog-collapse-btn:hover {
  background: #ede4d3;
  color: #8B7355;
}

.read-page.warm .catalog-item:hover {
  background: #ede4d3;
}

.read-page.warm .catalog-item.active {
  background: #e0d5c0;
  border-left-color: #8B7355;
  color: #8B7355;
}

.read-page.warm .catalog-item.active .catalog-title {
  color: #8B7355;
}

/* 夜间模式 */
.read-page.dark .side-catalog,
.read-page.dark .catalog-content {
  background: #1a1a1a !important;
  border-right: 1px solid #333;
}

.read-page.dark .catalog-header {
  background: #1a1a1a !important;
  border-bottom-color: #333;
}

.read-page.dark .catalog-expand-btn {
  background: #2d2d2d !important;
}

/* 目录标题 */
.read-page.dark .catalog-header h4 {
  color: #888;  
}

.read-page.dark .catalog-collapse-btn {
  color: #888;
}

.read-page.dark .catalog-collapse-btn:hover {
  background: #2d2d2d;
  color: #409eff;
}

.read-page.dark .catalog-item {
  color: #ccc;
}

.read-page.dark .catalog-item:hover {
  background: #2d2d2d;
}

.read-page.dark .catalog-item.active {
  background: #2d2d2d;
  border-left-color: #409eff;
}

.read-page.dark .catalog-title {
  color: #ccc;
}

.read-page.dark .catalog-item.active .catalog-title {
  color: #409eff;
}

/* ========== 主题模式下工具栏的样式 ========== */

/* 白天模式 */
.read-page.light .side-toolbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
}

/* 护眼模式 */
.read-page.warm .side-toolbar,
.read-page.warm .toolbar-content {
  background: #f5f0e8 !important;
  border-left: 1px solid #e0d5c0;
}

.read-page.warm .toolbar-header {
  background: #f5f0e8 !important;
  border-bottom-color: #e0d5c0;
}

.read-page.warm .toolbar-expand-btn {
  background: #8B7355 !important;
}

.read-page.warm .toolbar-collapse-btn:hover {
  background: #ede4d3;
  color: #8B7355;
}

/* 夜间模式 */
.read-page.dark .side-toolbar,
.read-page.dark .toolbar-content {
  background: #1a1a1a !important;
  border-left: 1px solid #333;
}

.read-page.dark .toolbar-header {
  background: #1a1a1a !important;
  border-bottom-color: #333;
}

.read-page.dark .toolbar-expand-btn {
  background: #2d2d2d !important;
}

.read-page.dark .toolbar-collapse-btn {
  color: #888;
}

.read-page.dark .toolbar-collapse-btn:hover {
  background: #2d2d2d;
  color: #409eff;
}

/* 字体大小和行间距的数字显示 */
.read-page.dark .font-size-display {
  color: #888;  
}

/* ========== 主题模式 ========== */

/* 白天模式（默认） */
.read-page.light {
  background: #fff;
  color: #333;
}

.read-page.light .read-toolbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom-color: #ebeef5;
}

/* 护眼模式 */
.read-page.warm {
  background: #f5f0e8;
  color: #4a4a4a;
}

.read-page.warm .read-toolbar {
  background: #f5f0e8 !important;
  border-bottom-color: #e0d5c0;
}

/* 夜间模式样式 */
.read-page.dark {
  background: #1a1a1a;
  color: #ccc;
}

.read-page.dark .chapter-title {
  color: #ccc;
}

.read-page.dark .toolbar-center h3 {
  color: #ccc;
}
/* 设置标题 */
.read-page.dark .toolbar-header h4 {
  color: #888;  
}

.read-page.dark .chapter-info {
  color: #ccc;
}

.read-page.dark .nav-label {
  color: #888;
}

.read-page.dark .nav-title {
  color: #409eff;
}

.read-page.dark .read-toolbar {
  background: #1a1a1a !important;
  border-bottom-color: #333;
}

/* ========== 字体样式 ========== */

/* 宋体 */
.read-page.font-song .content {
  font-family: 'SimSun', '宋体', serif;
}

/* 黑体 */
.read-page.font-hei .content {
  font-family: 'SimHei', '黑体', sans-serif;
}

/* 楷体 */
.read-page.font-kai .content {
  font-family: 'KaiTi', '楷体', serif;
}

/* ========== 顶部工具栏 ========== */
.read-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 30px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1000;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
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
  transition: all 0.3s ease;
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
  transition: all 0.3s ease;
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
  .side-catalog {
    width: 240px;
  }
  
  .side-catalog.collapsed {
    width: 40px;
  }
  
  .catalog-expand-btn {
    width: 40px;
    height: 40px;
  }
  
  .side-toolbar {
    width: 240px;
  }
  
  .side-toolbar.collapsed {
    width: 40px;
  }
  
  .toolbar-expand-btn {
    width: 40px;
    height: 40px;
  }
  
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
</style>