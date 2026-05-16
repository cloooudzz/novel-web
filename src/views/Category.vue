<template>
  <div class="category">
    <h2 class="title">小说分类</h2>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 分类按钮 -->
    <div v-else>
      <el-space wrap class="category-group">
        <el-button 
          v-for="cat in categoryList" 
          :key="cat.id"
          :type="activeCategory === cat.id ? 'primary' : 'default'"
          plain 
          round
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </el-button>
      </el-space>

      <!-- 分类下的小说列表 -->
      <div class="novel-section" v-if="activeCategory">
        <div class="section-header">
          <h3>{{ currentCategoryName }}</h3>
          <span class="novel-count">共 {{ novelList.length }} 本小说</span>
        </div>
        
        <el-row :gutter="20">
          <el-col :span="6" v-for="item in novelList" :key="item.id">
            <el-card class="card" shadow="hover" @click="goToDetail(item.id)">
              <img :src="getCoverUrl(item.cover)" class="cover" />
              <h3 class="novel-title">{{ item.title }}</h3>
              <p class="author">{{ item.author }}</p>
              <div class="novel-info">
                <el-tag size="small" :type="item.status === 1 ? 'success' : 'info'">
                  {{ item.status === 1 ? '连载中' : '已完结' }}
                </el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="novelList.length === 0" description="该分类暂无小说" />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const categoryList = ref([])
const activeCategory = ref(null)
const novelList = ref([])

// 当前选中的分类名称
const currentCategoryName = ref('')

// 处理封面图片URL
const getCoverUrl = (cover) => {
  if (!cover) return 'https://picsum.photos/id/111/200/300'
  if (cover.startsWith('http')) return cover
  if (cover.startsWith('/')) return `http://localhost:8080${cover}`
  return 'https://picsum.photos/id/111/200/300'
}

const goToDetail = (novelId) => {
  router.push(`/novelDetail/${novelId}`)
}

// 获取所有分类
const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await request.get('/category/list')
    console.log('分类列表:', res)
    
    if (res.code === 200) {
      categoryList.value = res.data || []
      
      // 使用默认分类（如果后端没有数据）
      if (categoryList.value.length === 0) {
        useDefaultCategories()
      }
      
      // 初始化默认选中第一个分类
      initDefaultCategory()
    } else {
      useDefaultCategories()
      initDefaultCategory()
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    useDefaultCategories()
    initDefaultCategory()
  } finally {
    loading.value = false
  }
}

// 初始化默认选中分类
const initDefaultCategory = () => {
  //默认选择第一个分类
  activeCategory.value = categoryList.value[0].id
  currentCategoryName.value = categoryList.value[0].name
  fetchNovelsByCategory(categoryList.value[0].id)
}

// 默认分类数据
const useDefaultCategories = () => {
  categoryList.value = [
    { id: 1, name: '玄幻奇幻', sortOrder: 1 },
    { id: 2, name: '都市言情', sortOrder: 2 },
    { id: 3, name: '武侠仙侠', sortOrder: 3 },
    { id: 4, name: '科幻灵异', sortOrder: 4 },
    { id: 5, name: '历史军事', sortOrder: 5 },
    { id: 6, name: '游戏竞技', sortOrder: 6 },
    { id: 7, name: '悬疑推理', sortOrder: 7 },
    { id: 8, name: '现代言情', sortOrder: 8 }
  ]
}

// 选择分类
const selectCategory = (categoryId) => {
  activeCategory.value = categoryId
  const category = categoryList.value.find(c => c.id === categoryId)
  currentCategoryName.value = category ? category.name : ''
  fetchNovelsByCategory(categoryId)
}

// 获取分类下的小说
const fetchNovelsByCategory = async (categoryId) => {
  try {
    const res = await request.get(`/novel/category/${categoryId}`)
    console.log('分类小说:', res)
    
    if (res.code === 200) {
      novelList.value = res.data || []
      
      // 如果没有数据，使用模拟数据
      if (novelList.value.length === 0) {
        useMockNovels(categoryId)
      }
    } else {
      useMockNovels(categoryId)
    }
  } catch (error) {
    console.error('获取分类小说失败:', error)
    useMockNovels(categoryId)
  }
}

// 模拟小说数据
const useMockNovels = (categoryId) => {
  const mockNovels = {
    1: [ // 玄幻奇幻
      { id: 1, title: '武动乾坤', author: '天蚕土豆', cover: '/covers/1.jpg', status: 1 },
      { id: 3, title: '万古神帝', author: '飞天鱼', cover: '/covers/3.jpg', status: 1 },
      { id: 4, title: '斗破苍穹', author: '天蚕土豆', cover: '/covers/4.png', status: 0 },
      { id: 7, title: '完美世界', author: '辰东', cover: '/covers/7.jpg', status: 1 },
    ],
    2: [ // 都市言情
      { id: 2, title: '我真没想重生啊', author: '柳暗花又明', cover: '/covers/2.jpg', status: 0 },
    ],
    3: [ // 武侠仙侠
      { id: 5, title: '雪鹰领主', author: '我吃西红柿', cover: '/covers/5.jpg', status: 1 },
    ],
    6: [ // 游戏竞技
      { id: 6, title: '全职法师', author: '乱', cover: '/covers/6.jpg', status: 1 },
    ],
  }
  
  novelList.value = mockNovels[categoryId] || [
    { id: categoryId * 10 + 1, title: `分类${categoryId}小说1`, author: '作者', cover: '', status: 1 },
    { id: categoryId * 10 + 2, title: `分类${categoryId}小说2`, author: '作者', cover: '', status: 0 },
  ]
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.title { 
  font-size: 24px; 
  margin-bottom: 20px;
  color: #303133;
}

.category-group { 
  margin-top: 0px;
  margin-bottom: 5px;
}

.loading-container {
  padding: 40px 0;
}

.novel-section {
  margin-top: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h3 {
  font-size: 20px;
  margin: 0;
  color: #303133;
}

.novel-count {
  color: #909399;
  font-size: 14px;
}

.card { 
  border-radius: 8px; 
  overflow: hidden; 
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.cover { 
  width: 100%; 
  height: 240px; 
  object-fit: cover;
  background: #f5f7fa;
}

.novel-title { 
  font-size: 16px; 
  margin: 10px 0 5px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author { 
  font-size: 13px; 
  color: #909399;
  margin-bottom: 8px;
}

.novel-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}
</style>