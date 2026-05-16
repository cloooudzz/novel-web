<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2 class="title">用户登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="login" :loading="loading">登录</el-button>
          <el-button @click="$router.push('/register')">去注册</el-button>
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
  username: '',
  password: ''
})

const rules = ref({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

// 修改 login 函数
const login = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await request.post('/user/login', form.value)
    if (res.code === 200) {
      ElMessage.success('登录成功')
      localStorage.setItem('user', form.value.username)
      localStorage.setItem('userId', res.userId)
      
      // 获取用户完整信息（包括头像）
      try {
        const userInfoRes = await request.get('/user/current', {
          params: { userId: res.userId }
        })
        if (userInfoRes.code === 200 && userInfoRes.data.avatar) {
          localStorage.setItem('userAvatar', userInfoRes.data.avatar)
        } else {
          // 没有头像就清除旧的
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
  background: #f9f9f9;
  position: fixed;
  top: 0;
  left: 0;
}
.login-card {
  width: 420px;
  padding: 30px;
}
.title {
  text-align: center;
  margin-bottom: 24px;
  font-size: 22px;
}
</style>