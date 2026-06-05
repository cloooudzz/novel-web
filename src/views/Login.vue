<template>
  <div class="login-page">
    <div class="platform-title">在线小说阅读平台</div>
    <el-card class="login-card">
      <h2 class="title">账号登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        
        <!-- 验证码行 -->
        <el-form-item label="验证码" prop="captchaCode">
          <div class="captcha-row">
            <el-input 
              v-model="form.captchaCode" 
              placeholder="请输入验证码"
              class="captcha-input"
            />
            <div class="captcha-image" @click="refreshCaptcha">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
              <div v-else class="captcha-loading">加载中...</div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <div class="button-group">
            <el-button type="primary" @click="login" :loading="loading" class="btn">登录</el-button>
            <el-button @click="$router.push('/register')" class="btn">去注册</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

// 验证码相关
const captchaImage = ref('')
const captchaKey = ref('')

const form = ref({
  account: '',
  password: '',
  captchaCode: ''
})

// 表单验证规则
const rules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号长度应为3-20位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  captchaCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码长度为4位', trigger: 'blur' }
  ]
}

// 获取验证码
const fetchCaptcha = async () => {
  try {
    const res = await request.get('/captcha/get')
    if (res.code === 200 && res.data) {
      captchaImage.value = res.data.captchaImage
      captchaKey.value = res.data.captchaKey
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    // 生成模拟验证码（开发测试用）
    captchaImage.value = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="40"%3E%3Crect width="120" height="40" fill="%23f0f0f0"/%3E%3Ctext x="15" y="28" font-size="22" fill="%23666"%3E8A3F%3C/text%3E%3C/svg%3E'
    captchaKey.value = 'test_key_' + Date.now()
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  fetchCaptcha()
}

const login = async () => {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  loading.value = true
  try {
    const res = await request.post('/user/login', {
      account: form.value.account,
      password: form.value.password,
      captchaKey: captchaKey.value,
      captchaCode: form.value.captchaCode
    })
    
    if (res.code === 200) {
      ElMessage.success('登录成功')
      
      localStorage.setItem('token', res.token)
      localStorage.setItem('account', res.account || form.value.account)
      localStorage.setItem('username', res.username)
      localStorage.setItem('userId', res.userId)
      
      if (res.avatar) {
        localStorage.setItem('userAvatar', res.avatar)
      }
      
      router.push('/')
    } else {
      console.log('登录失败响应:', res)
      ElMessage({
        message: res.msg || '登录失败',
        type: 'error',
        duration: 1500
      })
      // 登录失败时刷新验证码
      setTimeout(() => {
        refreshCaptcha()
        form.value.captchaCode = ''
      }, 1500)
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('服务器连接失败')
    refreshCaptcha()
    form.value.captchaCode = ''
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCaptcha()
})
</script>

<style scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  background-image: url('@/assets/背景.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
.login-card {
  width: 450px;
  border-radius: 16px;
  box-shadow: 0 20px 35px rgba(0, 0, 0, 0.2);
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}
.title {
  text-align: center;
  margin-bottom: 24px;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}
.button-group {
  display: flex;
  gap: 12px;
  width: 100%;
}
.btn {
  flex: 1;
}

.platform-title {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 4px;
  text-shadow: 8px 8px 8px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

/* 验证码样式 */
.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-loading {
  font-size: 12px;
  color: #999;
}

.captcha-image:hover {
  opacity: 0.8;
}

/* 响应式 */
@media (max-width: 500px) {
  .login-card {
    width: 90%;
    margin: 0 20px;
    padding: 20px;
  }
  
  .platform-title {
    font-size: 24px;
    top: 10%;
    white-space: nowrap;
  }
  
  .captcha-row {
    flex-direction: column;
  }
  
  .captcha-image {
    width: 100%;
    height: 44px;
  }
}
</style>