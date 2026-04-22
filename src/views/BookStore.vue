<template>
  <div class="bookstore">
    <h2 class="title">全部小说书城</h2>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 小说列表 -->
    <div v-else>
      <div class="book-count">共 {{ bookList.length }} 本小说</div>
      <el-row :gutter="20">
        <el-col :span="6" v-for="item in bookList" :key="item.id">
          <el-card class="card" shadow="hover" @click="goToDetail(item.id)">
            <img :src="getCoverUrl(item.cover)" class="cover" />
            <h3 class="novel-title">{{ item.title }}</h3>
            <p class="author">{{ item.author }}</p>
            <div class="novel-info">
              <el-tag size="small" :type="item.status === 1 ? 'success' : 'info'">
                {{ item.status === 1 ? '连载中' : '已完结' }}
              </el-tag>
              <span class="id-info">ID: {{ item.id }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="bookList.length === 0" description="暂无小说数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const bookList = ref([])
const loading = ref(false)

// 处理封面图片URL
const getCoverUrl = (cover) => {
  if (!cover) return 'https://picsum.photos/id/111/200/300'
  // 如果是完整URL（以http开头），直接返回
  if (cover.startsWith('http')) return cover
  // 如果是相对路径（以/开头），拼接后端地址
  if (cover.startsWith('/')) return `http://localhost:8080${cover}`
  // 其他情况，默认返回占位图
  return 'https://picsum.photos/id/111/200/300'
}

const goToDetail = (novelId) => {
  router.push(`/novelDetail/${novelId}`)
}

// 获取所有小说（按ID排序）
const fetchNovels = async () => {
  loading.value = true
  try {
    const res = await request.get('/novel/list')
    console.log('获取到的小说数据:', res)
    
    if (res.code === 200) {
      // 按ID从小到大排序
      const sortedList = (res.data || []).sort((a, b) => {
        return (a.id || 0) - (b.id || 0)
      })
      bookList.value = sortedList
      console.log('排序后的小说列表:', bookList.value)
    } else {
      ElMessage.error(res.msg || '获取小说列表失败')
      // 失败时使用默认数据
      useDefaultData()
    }
  } catch (error) {
    console.error('获取小说列表失败:', error)
    // 请求失败时使用默认数据
    useDefaultData()
  } finally {
    loading.value = false
  }
}

// 默认数据（当后端无法访问时使用）
const useDefaultData = () => {
  bookList.value = [
    { id: 1, title: '武动乾坤', author: '天蚕土豆', cover: '/covers/1.jpg', status: 1 },
    { id: 2, title: '我真没想重生啊', author: '柳暗花又明', cover: '/covers/2.jpg', status: 0 },
    { id: 3, title: '万古神帝', author: '飞天鱼', cover: '/covers/3.jpg', status: 1 },
    { id: 4, title: '斗破苍穹', author: '天蚕土豆', cover: '/covers/4.png', status: 0 },
    { id: 5, title: '雪鹰领主', author: '我吃西红柿', cover: '/covers/5.jpg', status: 1 },
    { id: 6, title: '全职法师', author: '乱', cover: '/covers/6.jpg', status: 1 },
    { id: 7, title: '完美世界', author: '辰东', cover: '/covers/7.jpg', status: 1 },
    { id: 8, title: '大主宰', author: '天蚕土豆', cover: '/covers/8.jpg', status: 0 }
  ].sort((a, b) => a.id - b.id) // 按ID排序
}

onMounted(() => {
  fetchNovels()
})
</script>

<style scoped>
.title { 
  font-size: 24px; 
  margin-bottom: 20px;
  color: #303133;
}

.book-count {
  margin-bottom: 16px;
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

.id-info {
  font-size: 12px;
  color: #c0c4cc;
}

.loading-container {
  padding: 40px 0;
}
</style>