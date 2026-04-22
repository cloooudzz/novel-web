<template>
  <div class="home-index">
    <!-- 轮播图 -->
    <div class="carousel-wrapper">
      <el-carousel height="800px" autoplay interval="4000">
        <el-carousel-item v-for="item in carouselList" :key="item.id" @click="goToDetail(item.id)">
          <div class="carousel-image-container">
            <img :src="getCoverUrl(item.cover)" class="carousel-img" />
          </div>
          <div class="carousel-info">
            <h2>{{ item.title }}</h2>
            <p>{{ item.author }} | {{ item.intro }}</p>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 热门推荐 -->
    <div class="section">
      <h2 class="title">热门推荐</h2>
      <el-row :gutter="20">
        <el-col :span="6" v-for="item in hotNovels" :key="item.id">
          <el-card class="card" shadow="hover" @click="goToDetail(item.id)">
            <img :src="getCoverUrl(item.cover)" class="cover"/>
            <h3 class="novel-title">{{ item.title }}</h3>
            <p class="author">{{ item.author }}</p>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'


// 轮播图数据（从数据库获取）
const carouselList = ref([])
const router = useRouter()

// 获取轮播图数据（可以获取热门或推荐的小说作为轮播）
const fetchCarouselList = async () => {
  try {
    // 方案1：获取热门小说前5本作为轮播图
    const res = await request.get('/novel/hot', { params: { limit: 5 } })
    if (res.code === 200) {
      carouselList.value = res.data
    }
    
  } catch (error) {
    console.error('获取轮播图数据失败:', error)
    // 失败时使用默认数据
    carouselList.value = [
      { id: 1, title: '武动乾坤', author: '天蚕土豆', intro: '热血玄幻大作', cover: 'https://picsum.photos/id/111/800/450' },
      { id: 2, title: '斗破苍穹', author: '天蚕土豆', intro: '莫欺少年穷', cover: 'https://picsum.photos/id/112/800/450' },
      { id: 3, title: '万古神帝', author: '飞天鱼', intro: '万古岁月，谁主沉浮', cover: 'https://picsum.photos/id/113/800/450' }
    ]
  }
}

// 热门推荐数据
const hotNovels = ref([])

const goToDetail = (novelId) => {
  router.push(`/novelDetail/${novelId}`)
}

// 获取热门小说
const fetchHotNovels = async () => {
  try {
    const res = await request.get('/novel/hot', { params: { limit: 8 } })
    if (res.code === 200) {
      hotNovels.value = res.data
    }
  } catch (error) {
    console.error('获取热门小说失败:', error)
  }
}

const getCoverUrl = (cover) => {
  if (!cover) return 'https://picsum.photos/id/111/200/300'
  if (cover.startsWith('http')) return cover
  if (cover.startsWith('/')) return `http://localhost:8080${cover}`
  return 'https://picsum.photos/id/111/200/300'
}

onMounted(() => {
  fetchCarouselList()
  fetchHotNovels()
})
</script>

<style scoped>
.carousel-wrapper {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 30px;
}
.carousel-wrapper :deep(.el-carousel__item) {
  cursor: pointer;
}
.carousel-image-container {
  width: 100%;
  height: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #acacbb 0%, #7793dd 100%);
}
.carousel-img {
  width: auto;
  height: 100%;              
  object-fit: cover;      
  object-position: center;
}
.carousel-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  padding: 30px;
  color: #fff;
  background: linear-gradient(transparent, rgba(28, 26, 26, 0.8));
  text-shadow: 1px 1px 2px rgba(250, 240, 240, 0.427);
}

.carousel-info h2 {
  font-size: 32px;
  margin-bottom: 8px;
  font-weight: bold;
}

.carousel-info p {
  font-size: 16px;
  opacity: 0.9;
}

.section { margin-top:20px; }
.title { font-size:20px; margin-bottom:16px; }
.card { 
  border-radius:8px; 
  overflow:hidden;
  cursor: pointer;
  transition: transform 0.3s;
}
.card:hover {
  transform: translateY(-5px);
}
.cover { width:100%; height:240px; object-fit:cover; }
.novel-title { font-size:15px; margin:8px 0 4px; }
.author { font-size:12px; color:#999; }
</style>