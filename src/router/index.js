import { createRouter, createWebHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
    children: [
      { path: '', component: () => import('@/views/HomeIndex.vue') },
      { path: 'bookstore', component: () => import('@/views/BookStore.vue') },
      { path: 'category', component: () => import('@/views/Category.vue') },
      { path: 'rank', component: () => import('@/views/Rank.vue') },
      { path: 'shelf', component: () => import('@/views/Shelf.vue') },
      { path: '/user',component: () => import('@/views/User.vue') }// 个人中心
    ]
  },
  {
    path: '/novelDetail/:id',
    name: 'NovelDetail',
    component: () => import('@/views/NovelDetail.vue') // 小说详情页
  },
  {
    path: '/read/:novelId/:chapterId',
    name: 'Read',
    component: () => import('@/views/Read.vue') // 阅读页（核心）
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue') // 登录页
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue') // 注册页
  },
  {
  path: '/search',
  name: 'Search',
  component: () => import('@/views/Search.vue')
  },
  {
    path: '/writer',           // 添加作家页面路由
    name: 'Writer',
    component: () => import('@/views/Writer.vue') // 作家申请页
  },
  {
    path: '/writer-helper',
    name: 'WriterHelper',
    component: () => import('@/views/WriterHelper.vue')
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router