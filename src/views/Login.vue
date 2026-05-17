<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2 class="title">账号登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = ref({
  account: '',
  password: ''
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
  ]
}

const login = async () => {
  // 触发表单验证
  try {
    await formRef.value.validate()
  } catch (error) {
    return  // 验证失败，不继续执行
  }

  loading.value = true
  try {
    const res = await request.post('/user/login', {
      account: form.value.account,
      password: form.value.password
    })
    
    if (res.code === 200) {
      ElMessage.success('登录成功')
      localStorage.setItem('account', res.account || form.value.account)
      localStorage.setItem('username', res.username)
      localStorage.setItem('userId', res.userId)
      
      // 获取用户完整信息（包括头像）
      try {
        const userInfoRes = await request.get('/user/current', {
          params: { userId: res.userId }
        })
        if (userInfoRes.code === 200 && userInfoRes.data.avatar) {
          localStorage.setItem('userAvatar', userInfoRes.data.avatar)
        } else {
          localStorage.removeItem('userAvatar')
        }
      } catch (err) {
        console.error('获取用户信息失败:', err)
        localStorage.removeItem('userAvatar')
      }
      
      router.push('/')
    } else {
      ElMessage.error(res.msg || '登录失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('服务器连接失败')
  } finally {
    loading.value = false
  }
}
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
}
.login-card {
  width: 450px;
  border-radius: 16px;
  box-shadow: 0 20px 35px rgba(0, 0, 0, 0.2);
  padding: 30px;
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
</style>