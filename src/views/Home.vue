<template>
  <div class="home-layout">
    <el-header class="header">
      <div class="header-left">
        <h1 class="logo">在线小说阅读平台</h1>
        <nav class="nav">
          <el-button text @click="$router.push('/')" :class="{ active: $route.path === '/' }">首页</el-button>
          <el-button text @click="$router.push('/bookstore')" :class="{ active: $route.path === '/bookstore' }">书城</el-button>
          <el-button text @click="$router.push('/category')" :class="{ active: $route.path === '/category' }">分类</el-button>
          <el-button text @click="$router.push('/rank')" :class="{ active: $route.path === '/rank' }">排行</el-button>
          <el-button text @click="$router.push('/shelf')" :class="{ active: $route.path === '/shelf' }">书架</el-button>
        </nav>
      </div>
      <div class="header-right">
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索小说" 
          class="search-box" 
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <img src="@/assets/搜索.png" class="search-icon" alt="搜索" />
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
        <div v-if="isLogin" class="user-dropdown">
          <el-dropdown trigger="hover" @command="handleDropdownCommand" placement="bottom">
            <div class="user-info" style="cursor: pointer;">
              <el-avatar class="avatar" :src="userAvatar" icon="User" />
              <span class="username">{{ username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="userCenter">个人中心</el-dropdown-item>
                <el-dropdown-item :command="isAuthor ? 'writerHelper' : 'becomeWriter'" 
                                  :class="isAuthor ? 'writer-helper-item' : 'writer-item'">
                  {{ isAuthor ? '作家助手' : '成为作家' }}
                </el-dropdown-item>
                <el-dropdown-item command="logout" class="logout-item">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div v-else class="auth-buttons">
          <el-button type="primary" plain @click="$router.push('/login')">登录</el-button>
          <el-button @click="$router.push('/register')">注册</el-button>
        </div>
      </div>
    </el-header>

    <el-main class="main">
      <router-view />
    </el-main>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, provide, computed, onMounted, onUnmounted, watch } from 'vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

// 获取完整的头像URL
const getFullAvatarUrl = (avatar) => {
  if (!avatar || avatar === 'null' || avatar === 'undefined') {
    return 'https://picsum.photos/id/64/100/100'
  }
  if (avatar.startsWith('http')) {
    return avatar
  }
  return `http://localhost:8080${avatar}`
}

const searchKeyword = ref('')

const handleSearch = () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push({ path: '/search', query: { keyword: keyword } })
}

// 用户信息状态
const userInfo = ref({
  username: localStorage.getItem('username') || '',
  avatar: getFullAvatarUrl(localStorage.getItem('userAvatar'))
})

const username = computed(() => userInfo.value.username)
const userAvatar = computed(() => userInfo.value.avatar)
const isLogin = computed(() => !!localStorage.getItem('userId'))

// 作者状态
const isAuthor = ref(false)

// 提供更新方法给子组件
const updateUserInfo = (key, value) => {
  console.log('updateUserInfo called:', key, value)
  if (key === 'username') {
    userInfo.value.username = value
    localStorage.setItem('username', value)
  } else if (key === 'avatar') {
    userInfo.value.avatar = getFullAvatarUrl(value)
    localStorage.setItem('userAvatar', value)
  }
}

provide('userInfo', userInfo)
provide('updateUserInfo', updateUserInfo)

// 检查是否是作者
const checkAuthorStatus = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) {
    isAuthor.value = false
    return
  }
  try {
    // 去掉 params，token 会自动带上，后端从 request 获取 userId
    const res = await request.get('/author/check')
    if (res.code === 200) {
      isAuthor.value = res.isAuthor
    }
  } catch (error) {
    console.error('检查作者状态失败:', error)
    isAuthor.value = false
  }
}

// 同步用户信息
const syncUserInfoFromStorage = () => {
  const username = localStorage.getItem('username')
  const avatar = localStorage.getItem('userAvatar')
  const userId = localStorage.getItem('userId')
  
  console.log('同步用户信息 - username:', username, 'avatar:', avatar, 'userId:', userId)
  
  if (username && userId) {
    userInfo.value.username = username
    userInfo.value.avatar = getFullAvatarUrl(avatar)
  } else {
    userInfo.value.username = ''
    userInfo.value.avatar = 'https://picsum.photos/id/64/100/100'
  }
}

// 监听 localStorage 变化
const handleStorageChange = (e) => {
  console.log('storage事件触发:', e.key, e.newValue)
  
  if (e.key === 'userAvatar') {
    userInfo.value.avatar = getFullAvatarUrl(e.newValue)
  } else if (e.key === 'username') {
    userInfo.value.username = e.newValue || ''
  } else if (e.key === 'userId') {
    if (!e.newValue) {
      userInfo.value.username = ''
      userInfo.value.avatar = 'https://picsum.photos/id/64/100/100'
      isAuthor.value = false
    } else {
      checkAuthorStatus()
    }
  }
}

// 处理下拉菜单命令
const handleDropdownCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
      confirmButtonText: '确认退出',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      logout()
    }).catch(() => {
      ElMessage.info('已取消退出')
    })
  } else if (command === 'userCenter') {
    router.push('/user')
  } else if (command === 'becomeWriter') {
    router.push('/writer')
  } else if (command === 'writerHelper') {
    router.push('/writer-helper')
  }
}

// 退出登录
const logout = () => {
  localStorage.removeItem('token')  // 新增
  localStorage.removeItem('username')
  localStorage.removeItem('account')
  localStorage.removeItem('userId')
  localStorage.removeItem('userAvatar')
  
  userInfo.value.username = ''
  userInfo.value.avatar = 'https://picsum.photos/id/64/100/100'
  isAuthor.value = false
  
  ElMessage.success('退出成功')
  router.push('/login')
}

watch(
  () => route.path,
  () => {
    syncUserInfoFromStorage()
    checkAuthorStatus()
  }
)

onMounted(() => {
  syncUserInfoFromStorage()
  checkAuthorStatus()
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
.search-icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}

/* 核心样式：解决下拉菜单被遮挡/不显示问题 */
.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

/* 修复样式穿透：确保下拉菜单正常显示 */
:deep(.el-dropdown) {
  display: inline-block;
}
:deep(.el-dropdown-menu) {
  min-width: 120px;
  padding: 0;
  z-index: 9999 !important;
}
:deep(.el-dropdown-item) {
  text-align: center;
  padding: 10px 0;
  cursor: pointer;
}
:deep(.el-dropdown-item:hover) {
  background-color: #f5f7fa;
}
/* 成为作家选项样式 */
:deep(.writer-item) {
  color: #e6a23c !important;
}
:deep(.writer-item:hover) {
  color: #e6a23c !important;
  background-color: #fdf6ec !important;
}

/* 新增：退出登录选项红色样式 */
:deep(.logout-item) {
  color: #f56c6c !important;
}
:deep(.logout-item:hover) {
  color: #f56c6c !important;
  background-color: #fef0f0 !important;
}

/* 其他样式 */
.search-box {
  width: 240px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.user-info:hover {
  background-color: #f5f7fa;
}
.avatar {
  width: 36px;
  height: 36px;
}
.username {
  font-size: 14px;
  color: #333;
}
.auth-buttons {
  display: flex;
  gap: 10px;
}
.home-layout {
  min-height: 100vh;
  background: #f9f9f9;
}
.header {
  height: 65px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 999;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}
.logo {
  font-size: 22px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}
.nav {
  display: flex;
  gap: 10px;
}
.nav button.active {
  color: #409eff;
  font-weight: 500;
}
.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

@media (max-width: 992px) {
  .header {
    padding: 0 15px;
    height: auto;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 15px;
  }
  
  .header-left {
    flex: 1;
    gap: 15px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .nav {
    gap: 5px;
  }
  
  .nav .el-button {
    padding: 6px 10px;
    font-size: 13px;
  }
  
  .header-right {
    flex: 1;
    justify-content: flex-end;
  }
  
  .search-box {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    padding: 10px;
  }
  
  .header-left {
    justify-content: space-between;
    flex-wrap: wrap;
  }
  
  .logo {
    font-size: 16px;
  }
  
  .nav {
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .nav .el-button {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  .header-right {
    justify-content: space-between;
    margin-top: 5px;
  }
  
  .search-box {
    width: calc(100% - 120px);
  }
  
  .user-info {
    padding: 2px 5px;
  }
  
  .username {
    display: none;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
  }
  
  .main {
    padding: 15px;
  }
  
  :deep(.el-dropdown-menu) {
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .logo {
    font-size: 14px;
  }
  
  .nav .el-button {
    padding: 3px 6px;
    font-size: 11px;
  }
  
  .search-box {
    width: calc(100% - 100px);
  }
  
  .search-box :deep(.el-input__inner) {
    font-size: 12px;
  }
  
  .search-box :deep(.el-button) {
    padding: 8px 10px;
  }
  
  .auth-buttons .el-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>