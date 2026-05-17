<template>
  <div class="writer-helper">
    <div class="writer-header">
      <div class="header-left">
        <h2>作家助手</h2>
        <span class="pen-name">笔名：{{ penName }}</span>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateNovelDialog">
          <el-icon><Plus /></el-icon> 创建新书
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="我的作品" name="novels">
        <div v-if="novelsLoading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="novels.length > 0" class="novel-cards">
          <div v-for="novel in novels" :key="novel.id" class="novel-card">
            <div class="card-cover">
              <img :src="getCoverUrl(novel.cover)" @error="handleImageError" />
              <div class="card-status">
                <el-tag :type="novel.status === 1 ? 'success' : 'info'" size="small">
                  {{ novel.status === 1 ? '连载中' : '已完结' }}
                </el-tag>
              </div>
            </div>
            <div class="card-info">
              <h3>{{ novel.title }}</h3>
              <p class="intro">{{ truncateText(novel.intro, 80) }}</p>
              <div class="stats">
                <span><el-icon><View /></el-icon> {{ formatNumber(novel.viewCount) }}</span>
                <span><el-icon><Star /></el-icon> {{ formatNumber(novel.collectCount) }}</span>
                <span><el-icon><Document /></el-icon> {{ novel.totalChapters || 0 }}章</span>
              </div>
              <div class="card-actions">
                <el-button size="small" type="primary" @click="manageChapters(novel)">
                  <el-icon><Edit /></el-icon> 管理章节
                </el-button>
                <el-button size="small" @click="editNovel(novel)">
                  <el-icon><Setting /></el-icon> 编辑
                </el-button>
                <el-button size="small" type="danger" plain @click="deleteNovel(novel)">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="还没有作品，点击上方按钮创建新书">
          <el-button type="primary" @click="showCreateNovelDialog">创建新书</el-button>
        </el-empty>
      </el-tab-pane>

      <el-tab-pane label="章节管理" name="chapters" :disabled="!currentNovel">
        <div v-if="currentNovel" class="chapter-manager">
          <div class="manager-header">
            <div class="novel-info-brief">
              <img :src="getCoverUrl(currentNovel.cover)" class="brief-cover" />
              <div>
                <h3>{{ currentNovel.title }}</h3>
                <p>共 {{ chapters.length }} 章</p>
              </div>
            </div>
            <el-button type="primary" @click="showAddChapterDialog">
              <el-icon><Plus /></el-icon> 添加章节
            </el-button>
          </div>

          <div class="chapter-list">
            <div class="chapter-header-row">
              <span>章节号</span>
              <span>章节标题</span>
              <span>字数</span>
              <span>创建时间</span>
              <span>操作</span>
            </div>
            <div v-for="chapter in chapters" :key="chapter.id" class="chapter-row">
              <span class="chapter-num">第{{ chapter.chapterNum }}章</span>
              <span class="chapter-title">{{ chapter.title }}</span>
              <span>{{ chapter.wordCount || 0 }}字</span>
              <span>{{ formatDate(chapter.createTime) }}</span>
              <div class="row-actions">
                <el-button size="small" text @click="editChapter(chapter)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" text type="danger" @click="deleteChapter(chapter)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <el-empty v-if="chapters.length === 0" description="暂无章节，点击添加章节" />
          </div>
        </div>
        <div v-else class="select-novel-tip">
          <el-empty description="请先在「我的作品」中选择一部作品管理章节" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建/编辑小说弹窗 -->
    <el-dialog v-model="novelDialogVisible" :title="editingNovel ? '编辑小说' : '创建新书'" width="600px">
      <el-form :model="novelForm" :rules="novelRules" ref="novelFormRef" label-width="100px">
        <el-form-item label="书名" prop="title">
          <el-input v-model="novelForm.title" placeholder="请输入书名" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="novelForm.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面">
          <div class="cover-upload">
            <!-- 显示已有封面预览 -->
            <img v-if="novelForm.cover" :src="getFullCoverUrl(novelForm.cover)" class="preview-cover" />
            <div v-else-if="pendingCoverFile" class="pending-cover">
              <img :src="pendingCoverPreview" class="preview-cover" />
              <div class="pending-tag">待上传</div>
            </div>
            <div v-else class="preview-placeholder">预览封面</div>
            
            <el-upload
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
              :http-request="uploadCoverTemp"
              accept="image/*"
            >
              <el-button size="small" :loading="coverUploading">
                {{ editingNovel ? '更换封面' : '选择封面' }}
              </el-button>
            </el-upload>
            
            <el-button 
              v-if="novelForm.cover || pendingCoverFile" 
              size="small" 
              type="danger" 
              plain 
              @click="removeCover"
            >
              删除封面
            </el-button>
          </div>
          <div class="cover-tip">
            {{ editingNovel ? '更换封面后会自动保存' : '请先填写小说信息并保存，封面将在创建后自动上传' }}
          </div>
        </el-form-item>
        <el-form-item label="简介" prop="intro">
          <el-input v-model="novelForm.intro" type="textarea" :rows="4" placeholder="请输入小说简介" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="novelForm.status">
            <el-radio :value="1">连载中</el-radio>
            <el-radio :value="0">已完结</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="novelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNovel" :loading="novelSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑章节弹窗 -->
    <el-dialog v-model="chapterDialogVisible" :title="editingChapter ? '编辑章节' : '添加章节'" width="800px">
      <el-form :model="chapterForm" :rules="chapterRules" ref="chapterFormRef" label-width="100px">
        <el-form-item label="章节号" prop="chapterNum">
          <el-input-number v-model="chapterForm.chapterNum" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="章节标题" prop="title">
          <el-input v-model="chapterForm.title" placeholder="请输入章节标题" />
        </el-form-item>
        <el-form-item label="章节内容" prop="content">
          <el-input v-model="chapterForm.content" type="textarea" :rows="15" placeholder="请输入章节内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="chapterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveChapter" :loading="chapterSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Setting, Delete, View, Star, Document } from '@element-plus/icons-vue'
import request from '@/utils/request'

const penName = ref('')
const novels = ref([])
const novelsLoading = ref(false)
const activeTab = ref('novels')
const currentNovel = ref(null)
const chapters = ref([])
const categoryList = ref([])

// 封面上传loading
const coverUploading = ref(false)

// 临时存储待上传的封面文件（创建新书时）
const pendingCoverFile = ref(null)
const pendingCoverPreview = ref('')

// 小说表单
const novelDialogVisible = ref(false)
const editingNovel = ref(null)
const novelFormRef = ref()
const novelSaving = ref(false)
const novelForm = ref({
  title: '',
  categoryId: null,
  cover: '',
  intro: '',
  status: 1
})
const novelRules = {
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  intro: [{ required: true, message: '请输入简介', trigger: 'blur' }]
}

// 章节表单
const chapterDialogVisible = ref(false)
const editingChapter = ref(null)
const chapterFormRef = ref()
const chapterSaving = ref(false)
const chapterForm = ref({
  chapterNum: 1,
  title: '',
  content: ''
})
const chapterRules = {
  chapterNum: [{ required: true, message: '请输入章节号', trigger: 'blur' }],
  title: [{ required: true, message: '请输入章节标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入章节内容', trigger: 'blur' }]
}

// 获取封面URL（预览用）
const getCoverUrl = (cover) => {
  if (!cover) return 'https://picsum.photos/id/111/200/300'
  if (cover.startsWith('http')) return cover
  if (cover.startsWith('/')) return `http://localhost:8080${cover}`
  return 'https://picsum.photos/id/111/200/300'
}

// 获取完整URL（弹窗预览用）
const getFullCoverUrl = (cover) => {
  if (!cover) return ''
  if (cover.startsWith('http')) return cover
  if (cover.startsWith('/')) return `http://localhost:8080${cover}`
  return cover
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

// 格式化数字
const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  return num.toString()
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 封面上传前的校验
const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片格式文件！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('封面图片大小不能超过 10MB！')
    return false
  }
  return true
}

// 临时上传封面（先保存文件，等创建小说后再真正保存）
const uploadCoverTemp = async (options) => {
  const file = options.file
  
  // 生成预览
  const reader = new FileReader()
  reader.onload = (e) => {
    pendingCoverPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
  
  // 保存文件对象，等创建小说后再上传
  pendingCoverFile.value = file
  ElMessage.success('封面已选择，保存小说后将自动上传')
}

// 真正上传封面（带 novelId）
const uploadCoverWithId = async (novelId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('novelId', novelId)

  try {
    const res = await request({
      method: 'post',
      url: '/upload/cover',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (res.code === 200) {
      const coverUrl = res.data.coverUrl
      // 更新小说的封面
      await updateNovelCover(novelId, coverUrl)
      return coverUrl
    } else {
      ElMessage.error(res.msg || '封面上传失败')
      return null
    }
  } catch (err) {
    console.error('封面上传失败:', err)
    ElMessage.error('封面上传失败：' + (err.response?.data?.msg || err.message))
    return null
  }
}

// 更新小说封面
const updateNovelCover = async (novelId, coverUrl) => {
  const userId = localStorage.getItem('userId')
  try {
    await request.put('/author/novel/update', {
      novelId: novelId,
      userId: Number(userId),
      cover: coverUrl
      // 其他字段不传，只更新封面
    })
    return true
  } catch (error) {
    console.error('更新封面失败:', error)
    return false
  }
}

// 删除封面
const removeCover = () => {
  if (editingNovel.value) {
    // 编辑模式：直接清空封面字段
    novelForm.value.cover = ''
    ElMessage.info('封面已清除，保存后生效')
  } else {
    // 创建模式：清除待上传的封面
    pendingCoverFile.value = null
    pendingCoverPreview.value = ''
    ElMessage.info('封面已清除')
  }
}

// 获取作者信息
const fetchAuthorInfo = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) return
  
  try {
    const res = await request.get('/author/info', { params: { userId: Number(userId) } })
    if (res.code === 200 && res.data) {
      penName.value = res.data.penName
    }
  } catch (error) {
    console.error('获取作者信息失败:', error)
  }
}

// 获取小说列表
const fetchNovels = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) return
  
  novelsLoading.value = true
  try {
    const res = await request.get('/author/novels', { params: { userId: Number(userId) } })
    if (res.code === 200) {
      novels.value = res.data || []
    }
  } catch (error) {
    console.error('获取小说列表失败:', error)
    ElMessage.error('获取小说列表失败')
  } finally {
    novelsLoading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await request.get('/category/list')
    if (res.code === 200) {
      categoryList.value = res.data || []
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 获取章节列表
const fetchChapters = async (novelId) => {
  const userId = localStorage.getItem('userId')
  try {
    const res = await request.get('/author/chapters', { 
      params: { novelId, userId: Number(userId) } 
    })
    if (res.code === 200) {
      chapters.value = res.data || []
    }
  } catch (error) {
    console.error('获取章节列表失败:', error)
    ElMessage.error('获取章节列表失败')
  }
}

// 显示创建小说弹窗
const showCreateNovelDialog = () => {
  editingNovel.value = null
  pendingCoverFile.value = null
  pendingCoverPreview.value = ''
  novelForm.value = {
    title: '',
    categoryId: null,
    cover: '',
    intro: '',
    status: 1
  }
  novelDialogVisible.value = true
}

// 编辑小说
const editNovel = (novel) => {
  editingNovel.value = novel
  pendingCoverFile.value = null
  pendingCoverPreview.value = ''
  novelForm.value = {
    title: novel.title || '',
    categoryId: novel.categoryId || null,
    cover: novel.cover || '',
    intro: novel.intro || '',
    status: novel.status !== undefined ? novel.status : 1
  }
  novelDialogVisible.value = true
}

// 保存小说
const saveNovel = async () => {
  await novelFormRef.value.validate()
  
  const userId = localStorage.getItem('userId')
  novelSaving.value = true
  
  try {
    let res
    if (editingNovel.value) {
      // 编辑模式：直接更新
      res = await request.put('/author/novel/update', {
        novelId: editingNovel.value.id,
        userId: Number(userId),
        title: novelForm.value.title,
        categoryId: novelForm.value.categoryId,
        cover: novelForm.value.cover,
        intro: novelForm.value.intro,
        status: novelForm.value.status
      })
      
      if (res.code === 200) {
        ElMessage.success('更新成功')
        novelDialogVisible.value = false
        fetchNovels()
      } else {
        ElMessage.error(res.msg || '操作失败')
      }
    } else {
      // 创建模式：先创建小说（不传封面）
      res = await request.post('/author/novel/create', {
        userId: Number(userId),
        title: novelForm.value.title,
        authorName: penName.value,
        categoryId: novelForm.value.categoryId,
        cover: '',  // 先不传封面
        intro: novelForm.value.intro,
        status: novelForm.value.status
      })
      
      if (res.code === 200) {
        const newNovelId = res.novelId
        
        // 如果有待上传的封面，上传封面
        if (pendingCoverFile.value) {
          const coverUrl = await uploadCoverWithId(newNovelId, pendingCoverFile.value)
          if (coverUrl) {
            ElMessage.success('小说创建成功，封面上传完成')
          } else {
            ElMessage.warning('小说创建成功，但封面上传失败，可稍后重新上传')
          }
        } else {
          ElMessage.success('小说创建成功')
        }
        
        novelDialogVisible.value = false
        pendingCoverFile.value = null
        pendingCoverPreview.value = ''
        fetchNovels()
      } else {
        ElMessage.error(res.msg || '创建失败')
      }
    }
  } catch (error) {
    console.error('保存小说失败:', error)
    ElMessage.error('操作失败')
  } finally {
    novelSaving.value = false
  }
}

// 删除小说
const deleteNovel = (novel) => {
  ElMessageBox.confirm(`确定删除《${novel.title}》吗？删除后不可恢复！`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const userId = localStorage.getItem('userId')
    try {
      const res = await request.delete('/author/novel/delete', {
        params: { novelId: novel.id, userId: Number(userId) }
      })
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchNovels()
        if (currentNovel.value?.id === novel.id) {
          currentNovel.value = null
          chapters.value = []
          activeTab.value = 'novels'
        }
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 管理章节
const manageChapters = async (novel) => {
  currentNovel.value = novel
  await fetchChapters(novel.id)
  activeTab.value = 'chapters'
}

// 标签页切换
const handleTabClick = () => {
  if (activeTab.value === 'novels') {
    fetchNovels()
  }
}

// 显示添加章节弹窗
const showAddChapterDialog = () => {
  editingChapter.value = null
  const maxNum = chapters.value.length > 0 
    ? Math.max(...chapters.value.map(c => c.chapterNum)) + 1 
    : 1
  chapterForm.value = {
    chapterNum: maxNum,
    title: '',
    content: ''
  }
  chapterDialogVisible.value = true
}

// 编辑章节
const editChapter = async (chapter) => {
  const userId = localStorage.getItem('userId')
  try {
    const res = await request.get('/author/chapter/detail', {
      params: { chapterId: chapter.id, userId: Number(userId) }
    })
    
    if (res.code === 200 && res.data) {
      const detail = res.data
      editingChapter.value = detail
      chapterForm.value = {
        chapterNum: detail.chapterNum,
        title: detail.title || '',
        content: detail.content || ''
      }
      chapterDialogVisible.value = true
    } else {
      ElMessage.error('获取章节详情失败')
    }
  } catch (error) {
    console.error('获取章节详情失败:', error)
    ElMessage.error('获取章节详情失败')
  }
}

// 保存章节
const saveChapter = async () => {
  await chapterFormRef.value.validate()
  
  const userId = localStorage.getItem('userId')
  chapterSaving.value = true
  
  try {
    let res
    if (editingChapter.value) {
      res = await request.put('/author/chapter/update', {
        chapterId: editingChapter.value.id,
        userId: Number(userId),
        title: chapterForm.value.title,
        content: chapterForm.value.content
      })
    } else {
      res = await request.post('/author/chapter/add', {
        novelId: currentNovel.value.id,
        userId: Number(userId),
        chapterNum: chapterForm.value.chapterNum,
        title: chapterForm.value.title,
        content: chapterForm.value.content
      })
    }
    
    if (res.code === 200) {
      ElMessage.success(editingChapter.value ? '更新成功' : '添加成功')
      chapterDialogVisible.value = false
      await fetchChapters(currentNovel.value.id)
      fetchNovels()
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (error) {
    console.error('保存章节失败:', error)
    ElMessage.error('操作失败')
  } finally {
    chapterSaving.value = false
  }
}

// 删除章节
const deleteChapter = (chapter) => {
  ElMessageBox.confirm(`确定删除第${chapter.chapterNum}章《${chapter.title}》吗？`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const userId = localStorage.getItem('userId')
    try {
      const res = await request.delete('/author/chapter/delete', {
        params: { chapterId: chapter.id, userId: Number(userId) }
      })
      if (res.code === 200) {
        ElMessage.success('删除成功')
        await fetchChapters(currentNovel.value.id)
        fetchNovels()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchAuthorInfo()
  fetchNovels()
  fetchCategories()
})
</script>

<style scoped>
.writer-helper {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.writer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: #303133;
}

.pen-name {
  font-size: 14px;
  color: #67c23a;
}

.loading-container {
  padding: 40px 0;
}

/* 小说卡片网格 - 每行2个 */
.novel-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

/* 小说卡片 */
.novel-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.novel-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* 封面区域 */
.card-cover {
  position: relative;
  flex-shrink: 0;
}

.card-cover img {
  width: 130px;
  height: 170px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-status {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  text-align: center;
}

/* 信息区域 */
.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.card-info h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info .intro {
  font-size: 13px;
  color: #606266;
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 统计数据 */
.stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 操作按钮 */
.card-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

/* 章节管理区域 */
.chapter-manager {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.novel-info-brief {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brief-cover {
  width: 50px;
  height: 65px;
  object-fit: cover;
  border-radius: 8px;
}

.novel-info-brief h3 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #303133;
}

.novel-info-brief p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

/* 章节列表 */
.chapter-list {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  overflow: hidden;
}

.chapter-header-row {
  display: grid;
  grid-template-columns: 80px 1fr 80px 100px 100px;
  background: #f5f7fa;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

.chapter-row {
  display: grid;
  grid-template-columns: 80px 1fr 80px 100px 100px;
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: 1px solid #ebeef5;
  align-items: center;
  transition: background 0.2s;
}

.chapter-row:hover {
  background: #f5f7fa;
}

.chapter-num {
  color: #409eff;
  font-weight: 500;
}

.chapter-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.select-novel-tip {
  padding: 60px 0;
}

/* 封面上传 */
.cover-upload {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.preview-cover {
  width: 80px;
  height: 104px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.preview-placeholder {
  width: 80px;
  height: 104px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #c0c4cc;
  border: 1px dashed #dcdfe6;
}

.pending-cover {
  position: relative;
}

.pending-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(230, 162, 60, 0.9);
  color: white;
  font-size: 10px;
  text-align: center;
  border-radius: 0 0 8px 8px;
  padding: 2px;
}

.cover-tip {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 8px;
}

/* 弹窗内表单 */
:deep(.el-dialog) {
  border-radius: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-textarea__inner) {
  font-family: inherit;
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 1000px) {
  .novel-cards {
    grid-template-columns: 1fr;
  }
  
  .chapter-header-row,
  .chapter-row {
    grid-template-columns: 60px 1fr 60px 80px 80px;
    font-size: 12px;
    gap: 4px;
  }
}

@media (max-width: 768px) {
  .writer-helper {
    padding: 12px;
  }
  
  .writer-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
  }
  
  .header-right .el-button {
    width: 100%;
  }
  
  .novel-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .card-cover img {
    width: 120px;
    height: 160px;
  }
  
  .stats {
    justify-content: center;
  }
  
  .card-actions {
    justify-content: center;
  }
  
  .manager-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .chapter-header-row,
  .chapter-row {
    grid-template-columns: 50px 1fr 50px 60px 70px;
    font-size: 11px;
    padding: 8px 10px;
  }
  
  .cover-upload {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>