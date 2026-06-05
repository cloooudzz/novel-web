<template>
  <div class="detail" v-loading="loading">
    <!-- 返回按钮 -->
    <div class="back-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <span class="page-title">小说详情</span>
      <div class="placeholder"></div>
    </div>
    
    <!-- 显示错误信息 -->
    <el-alert 
      v-if="errorMsg" 
      :title="errorMsg" 
      type="error" 
      :closable="false" 
      style="margin-bottom: 20px;"
    />
    
    <div class="book-info" v-if="info.id">
      <img :src="getCoverUrl(info.cover)" class="cover" @error="handleImageError" />
      <div class="info">
        <h1>{{ info.title }}</h1>
        
        <!-- 显示阅读进度提示 -->
        <el-alert 
          v-if="hasReadRecord" 
          type="success" 
          :closable="false"
          style="margin-bottom: 15px;"
        >
          <template #title>
            <span>📖 上次阅读到：第{{ readProgress }}章 
              <span v-if="readProgressTitle">- {{ readProgressTitle }}</span>
            </span>
          </template>
        </el-alert>
        
        <p><span class="label">作者：</span>{{ info.author }}</p>
        <p><span class="label">分类：</span>{{ info.categoryName || '未知分类' }}</p>
        <p>
          <span class="label">状态：</span>
          <el-tag :type="info.status === 1 ? 'success' : 'info'" size="small">
            {{ info.status === 1 ? '连载中' : '已完结' }}
          </el-tag>
        </p>
        <p><span class="label">总章节：</span>{{ info.totalChapters || 0 }}章</p>
        <p v-if="info.lastChapterTitle">
          <span class="label">最新章节：</span>
          <span class="last-chapter" @click="goRead(info.lastChapterNum)">
            {{ info.lastChapterTitle }}
          </span>
        </p>
        <p><span class="label">点击量：</span>{{ formatNumber(info.viewCount) }}</p>
        <p class="intro">{{ info.intro || '暂无简介' }}</p>
        
        <div class="button-group">
          <!-- 主要按钮：根据阅读状态显示不同文字 -->
          <el-button type="primary" size="large" @click="startRead">
            {{ hasReadRecord ? `继续阅读 第${readProgress}章` : '开始阅读' }}
          </el-button>
          
          <!-- 如果有阅读记录，显示更多选项 -->
          <el-dropdown v-if="hasReadRecord" @command="handleReadCommand">
            <el-button size="large">
              更多 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="first">从第一章开始</el-dropdown-item>
                <el-dropdown-item command="latest" v-if="info.lastChapterNum">
                  阅读最新章节
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-button size="large" @click="addToShelf" :loading="shelfLoading">
            {{ inBookshelf ? '已在书架' : '加入书架' }}
          </el-button>
        </div>
      </div>
    </div>

    <div class="chapter-list" v-if="chapters.length > 0">
      <div class="chapter-header">
        <h2>章节列表</h2>
        <span class="chapter-count">共 {{ chapters.length }} 章</span>
      </div>
      <div class="chapter-grid">
        <div 
          class="chapter-item" 
          v-for="chapter in chapters" 
          :key="chapter.id"
          :class="{ 'read-chapter': chapter.chapterNum === readProgress }"
          @click="goRead(chapter.chapterNum)"
        >
          <span class="chapter-title">
            {{ chapter.title }}
            <el-tag v-if="chapter.chapterNum === readProgress" size="small" type="success">
              上次阅读
            </el-tag>
          </span>
        </div>
      </div>
    </div>

    <el-empty v-else-if="!loading" description="暂无章节" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { ArrowLeft, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const novelId = route.params.id

const loading = ref(false)
const shelfLoading = ref(false)
const errorMsg = ref('')

// 小说详情信息
const info = ref({
  id: null,
  title: '',
  author: '',
  categoryName: '',
  cover: '',
  intro: '',
  status: 1,
  viewCount: 0,
  totalChapters: 0,
  lastChapterTitle: '',
  lastChapterNum: null
})

const chapters = ref([])

// 存储上一个非阅读页的路由
const previousPath = ref('')

// 阅读进度相关
const readProgress = ref(1) // 默认第1章
const readProgressTitle = ref('') // 章节标题
const hasReadRecord = ref(false) // 是否有阅读记录
const inBookshelf = ref(false) // 是否在书架中

// 返回上一页
const goBack = () => {
  console.log('返回 -> 存储的路由：', previousPath.value)
  if (previousPath.value) {
    router.push(previousPath.value)
  } else if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

// 获取书架详情（包含阅读进度）
const fetchBookshelfDetail = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) {
    readProgress.value = 1
    hasReadRecord.value = false
    inBookshelf.value = false
    return
  }
  
  try {
    const res = await request.get('/bookshelf/list')
    
    if (res.code === 200 && res.data) {
      const shelfItem = res.data.find(item => item.novelId == novelId)
      
      if (shelfItem) {
        inBookshelf.value = true
        const progress = shelfItem.lastReadChapterNum || 1
        readProgress.value = progress
        hasReadRecord.value = progress > 1
        const chapter = chapters.value.find(c => c.chapterNum === progress)
        if (chapter) {
          readProgressTitle.value = chapter.title
        }
      } else {
        inBookshelf.value = false
        readProgress.value = 1
        hasReadRecord.value = false
      }
    }
  } catch (error) {
    console.error('获取书架详情失败:', error)
  }
}

// 开始阅读 - 跳转到阅读进度
const startRead = () => {
  if (chapters.value.length === 0) {
    ElMessage.warning('暂无章节内容')
    return
  }

  const targetChapter = readProgress.value
  router.push(`/read/${novelId}/${targetChapter}`)
  
  if (hasReadRecord.value) {
    ElMessage.success(`继续阅读第${targetChapter}章`)
  }
}

// 处理阅读命令
const handleReadCommand = (command) => {
  if (command === 'first') {
    router.push(`/read/${novelId}/1`)
    ElMessage.info('从第一章开始阅读')
  } else if (command === 'latest' && info.value.lastChapterNum) {
    router.push(`/read/${novelId}/${info.value.lastChapterNum}`)
    ElMessage.info(`跳转到最新章节：${info.value.lastChapterTitle}`)
  }
}

// 默认数据（当后端无法访问时使用）
const getDefaultData = (id) => {
  const defaultNovels = {
    '1': {
      id: 1,
      title: '武动乾坤',
      author: '天蚕土豆',
      categoryName: '玄幻奇幻',
      cover: 'https://pic1.zhimg.com/50/v2-3c5a8c5c5c5c5c5c5c5c5c5c5c5c5c5c.jpg',
      intro: '修炼一途，乃窃阴阳，夺造化，转涅盘，握生死，掌轮回。武之极，破苍穹，动乾坤！',
      status: 1,
      viewCount: 15600,
      totalChapters: 1307,
      lastChapterTitle: '第一千三百零七章 永恒不朽',
      lastChapterNum: 1307
    },
    '2': {
      id: 2,
      title: '我真没想重生啊',
      author: '柳暗花又明',
      categoryName: '都市言情',
      cover: 'https://static.zongheng.com/upload/cover/2020/10/1602312000.jpg',
      intro: '重生了？重生了！重生了！重要的事情说三遍！重生了就重生了，为什么还要问？我真没想重生啊！',
      status: 0,
      viewCount: 25300,
      totalChapters: 856,
      lastChapterTitle: '第八百五十六章 大结局',
      lastChapterNum: 856
    }
  }
  
  return defaultNovels[id] || {
    id: Number(id),
    title: `小说${id}`,
    author: '未知作者',
    categoryName: '未知分类',
    cover: '',
    intro: '暂无简介',
    status: 1,
    viewCount: 1000,
    totalChapters: 100,
    lastChapterTitle: '第一百章',
    lastChapterNum: 100
  }
}

// 处理封面图片URL
const getCoverUrl = (cover) => {
  if (!cover || cover === 'null' || cover === 'undefined') {
    return 'https://picsum.photos/id/111/200/300'
  }
  
  if (cover.startsWith('http://') || cover.startsWith('https://')) {
    return cover
  }
  
  if (cover.startsWith('/covers/')) {
    return `http://localhost:8080${cover}`
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

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 获取小说详情
const fetchNovelDetail = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await request.get(`/novel/detail/${novelId}`)
    
    if (res.code === 200 && res.data) {
      info.value = res.data
    } else {
      throw new Error(res.msg || '获取小说详情失败')
    }
  } catch (error) {
    console.error('获取小说详情失败，使用默认数据:', error)
    errorMsg.value = '后端服务未启动，使用默认数据显示'
    info.value = getDefaultData(novelId)
  } finally {
    loading.value = false
  }
}

// 获取章节列表
const fetchChapters = async () => {
  try {
    const res = await request.get(`/novel/chapters/${novelId}`)
    
    if (res.code === 200) {
      chapters.value = res.data || []
    }
    
    if (chapters.value.length === 0) {
      generateMockChapters()
    }
  } catch (error) {
    console.error('获取章节列表失败，生成模拟数据:', error)
    generateMockChapters()
  }
}

// 生成模拟章节
const generateMockChapters = () => {
  const totalChapters = Math.min(info.value.totalChapters || 50, 50)
  const titles = ['初入江湖', '奇遇', '突破', '战斗', '成长', '觉醒', '历练', '归来', '巅峰', '新生']
  
  chapters.value = Array.from({ length: totalChapters }, (_, i) => ({
    id: i + 1,
    chapterNum: i + 1,
    title: `第${i + 1}章 ${titles[i % titles.length]}`
  }))
}

const goRead = (chapterNum) => {
  router.push(`/read/${novelId}/${chapterNum}`)
}

const addToShelf = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  shelfLoading.value = true
  try {
    // 去掉 userId，token 会自动带上
    const res = await request.post('/bookshelf/add', {
      novelId: Number(novelId)
    })
    
    if (res.code === 200) {
      ElMessage.success('已加入书架')
      inBookshelf.value = true
    } else {
      ElMessage.info(res.msg || '已在书架中')
    }
  } catch (error) {
    console.error('加入书架失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    shelfLoading.value = false
  }
}

onMounted(async () => {
  console.log('小说详情页加载，ID:', novelId)
  
  const saved = sessionStorage.getItem('prevRoute')
  if (saved && !saved.includes('/read/')) {
    previousPath.value = saved
    console.log('已载入上一页路由：', saved)
  }
  
  // 获取小说详情和章节列表
  await fetchNovelDetail()
  await fetchChapters()
  
  // 获取书架详情（包含阅读进度）
  await fetchBookshelfDetail()
})
</script>

<style scoped>
.detail {
  padding: 20px 0;
}

.back-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-left: 10px;
  margin-bottom: 5px;
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

.page-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 2px;
}

.placeholder {
  width: 80px;
  visibility: hidden;
}

.book-info {
  display: flex;
  gap: 30px;
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.cover {
  width: 200px;
  height: 260px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  background: #f5f7fa;
}

.info {
  flex: 1;
}

.info h1 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #303133;
}

.info p {
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
}

.label {
  color: #909399;
  margin-right: 5px;
}

.intro {
  color: #606266;
  line-height: 1.8;
  margin: 20px 0;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.last-chapter {
  color: #409eff;
  cursor: pointer;
}

.last-chapter:hover {
  text-decoration: underline;
}

.button-group {
  margin-top: 20px;
  display: flex;
  gap: 15px;
}

.chapter-list {
  margin-top: 30px;
  background: #fff;
  padding: 20px 30px;
  border-radius: 12px;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.chapter-header h2 {
  font-size: 20px;
  margin: 0;
}

.chapter-count {
  color: #909399;
  font-size: 14px;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 20px;
  max-height: 400px;
  overflow-y: auto;
}

.chapter-item {
  padding: 12px 10px;
  border-bottom: 1px dashed #ebeef5;
  cursor: pointer;
  transition: all 0.2s;
}

.chapter-item:hover {
  background: #ecf5ff;
  padding-left: 15px;
  color: #409eff;
}

.chapter-item.read-chapter {
  background: #f0f9ff;
  border-left: 3px solid #67c23a;
}

.chapter-title {
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
@media (max-width: 768px) {
  .back-header {
    margin-left: 0;
    margin-bottom: 0px;
  }
  .back-btn {
    padding: 0px 0px;
    font-size: 14px;
  }
  .page-title {
    font-size: 16px;
    position: static;
    transform: none;
  }
  .placeholder {
    display: none;
  }
  .book-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
    gap: 20px;
  }
  .cover {
    aspect-ratio: 3 / 4;
    width: 160px;
    height: auto;
    object-fit: cover;
    object-position: center;
  }
  .info h1 {
    font-size: 22px;
    margin-bottom: 15px;
  }
  .info p {
    font-size: 13px;
    text-align: left;
  }
  .intro {
    font-size: 13px;
    margin: 15px 0;
    padding: 12px;
    text-align: left;
  }
  .button-group {
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  .button-group .el-button {
    min-width: 120px;
    height: 40px;
  }
  .chapter-list {
    padding: 15px;
    margin-top: 20px;
  }
  .chapter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .chapter-header h2 {
    font-size: 18px;
  }
  .chapter-grid {
    grid-template-columns: 1fr;
    gap: 4px;
    max-height: 500px;
  }
  .chapter-item {
    padding: 10px;
  }
  .chapter-title {
    font-size: 13px;
  }
  .chapter-title .el-tag {
    font-size: 10px;
    height: 20px;
    line-height: 18px;
    padding: 0 6px;
  }
}

@media (max-width: 480px) {
  .detail {
    padding: 5px 0;
  }
  .back-btn {
    margin-left: 10px;
    font-size: 13px;
  }
  .page-title {
    font-size: 14px;
    justify-content: center;
  }
  .book-info {
    padding:10px;
    gap: 15px;
  }
  .cover {
    aspect-ratio: 3 / 4;
    width: 140px;
    height: auto;
  }
  .info h1 {
    font-size: 18px;
  }
  .info p {
    font-size: 12px;
  }
  .intro {
    font-size: 12px;
    padding: 10px;
  }
  .button-group .el-button {
    min-width: 100px;
    height: 36px;
    font-size: 13px;
  }
  .chapter-header h2 {
    font-size: 16px;
  }
  .chapter-title {
    font-size: 12px;
  }
}
</style>