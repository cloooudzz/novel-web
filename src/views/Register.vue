<template>
  <div class="register-page">
    <el-card class="register-card">
      <h2 class="title">用户注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="设置用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="设置密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input v-model="form.confirm" type="password" placeholder="再次输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="register" :loading="loading">注册</el-button>
          <el-button @click="$router.push('/login')">返回登录</el-button>
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
  password: '',
  confirm: ''
})

const checkSame = (rule, value, callback) => {
  if (value !== form.value.password) {
    callback(new Error('两次密码不一致'))
  } else callback()
}

const rules = ref({
  username: [{ required: true, trigger: 'blur' }],
  password: [{ required: true, trigger: 'blur' }],
  confirm: [{ required: true, validator: checkSame, trigger: 'blur' }]
})

const register = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await request.post('/user/register', {
      username: form.value.username,
      password: form.value.password
    })

    // 正确处理后端返回的code
    if (res.code === 200) {
      ElMessage.success('注册成功')
      router.push('/login')
    } else {
      // 业务错误（比如用户名已存在），正常提示，不弹服务器失败
      ElMessage.error(res.msg || '注册失败')
    }
  } catch (err) {
    // 只有真·网络错误（后端没启动、连不上）才弹这个
    console.error('网络错误：', err)
    ElMessage.error('服务器连接失败，请检查后端是否启动')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
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
.register-card {
  width: 420px;
  padding: 30px;
}
.title {
  text-align: center;
  margin-bottom: 24px;
  font-size: 22px;
}
</style>