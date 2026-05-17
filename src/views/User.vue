<template>
  <div class="user-page">
    <el-card class="user-card">
      <!-- 头像设置区域 -->
      <div class="avatar-section">
        <h3 class="section-title">头像设置</h3>
        <div class="avatar-upload">
          <el-avatar :src="userAvatar" class="current-avatar" />
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="avatarUpload"
          >
            <el-button type="primary" plain size="small">更换头像</el-button>
          </el-upload>
        </div>
      </div>

      <!-- 用户名修改区域 -->
      <div class="username-section">
        <h3 class="section-title">修改用户名</h3>
        <el-form :model="usernameForm" :rules="usernameRules" ref="usernameFormRef" label-width="100px">
          <el-form-item label="当前用户名">
            <el-input :value="currentUsername" disabled />
          </el-form-item>
          <el-form-item label="新用户名" prop="newUsername">
            <el-input v-model="usernameForm.newUsername" placeholder="请输入新用户名（2-20个字符）" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="updateUsername" :loading="usernameUpdateLoading">修改用户名</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 密码修改区域 -->
      <div class="password-section">
        <h3 class="section-title">修改密码</h3>
        <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
          <el-form-item label="原密码" prop="oldPassword">
            <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="updatePassword" :loading="updateLoading">提交修改</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 注入父组件提供的更新方法
const updateUserInfo = inject('updateUserInfo', (key, value) => {
  console.warn('updateUserInfo not provided, using fallback')
  if (key === 'username') {
    localStorage.setItem('username', value)
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'username',
      newValue: value
    }))
  } else if (key === 'avatar') {
    localStorage.setItem('userAvatar', value)
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'userAvatar',
      newValue: value
    }))
  }
})

// 用户头像
const userAvatar = ref('https://picsum.photos/id/64/100/100')
// 当前用户名 - 使用 'username' 而不是 'user'
const currentUsername = ref(localStorage.getItem('username') || '')

// 密码表单相关
const passwordFormRef = ref()
const updateLoading = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 用户名表单相关
const usernameFormRef = ref()
const usernameUpdateLoading = ref(false)
const usernameForm = ref({
  newUsername: ''
})

// 密码校验规则
const passwordRules = ref({
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 用户名校验规则
const usernameRules = ref({
  newUsername: [
    { required: true, message: '请输入新用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应为2-20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9\u4e00-\u9fa5]+$/, message: '用户名只能包含中英文和数字', trigger: 'blur' }
  ]
})

// 修改用户名
const updateUsername = async () => {
  await usernameFormRef.value.validate()
  
  try {
    await ElMessageBox.confirm(
      `确定要将用户名修改为「${usernameForm.value.newUsername}」吗？`,
      '确认修改',
      {
        confirmButtonText: '确认修改',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  
  usernameUpdateLoading.value = true
  const userId = localStorage.getItem('userId')
  
  if (!userId) {
    ElMessage.error('用户信息丢失，请重新登录')
    usernameUpdateLoading.value = false
    return
  }
  
  try {
    const res = await request({
      method: 'post',
      url: '/user/update-username',
      params: {
        userId: Number(userId),
        newUsername: usernameForm.value.newUsername
      }
    })
    
    if (res.code === 200) {
      // 使用注入的方法更新用户名
      updateUserInfo('username', res.newUsername)
      
      // 更新当前显示的用户名
      currentUsername.value = res.newUsername
      
      ElMessage.success('用户名修改成功')
      // 清空表单
      usernameForm.value.newUsername = ''
    } else {
      ElMessage.error(res.msg || '用户名修改失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('服务器连接失败')
  } finally {
    usernameUpdateLoading.value = false
  }
}

// 修改密码
const updatePassword = async () => {
  await passwordFormRef.value.validate()
  updateLoading.value = true
  const userId = localStorage.getItem('userId')
  if (!userId) {
    ElMessage.error('用户信息丢失，请重新登录')
    updateLoading.value = false
    return
  }
  try {
    const res = await request({
      method: 'post',
      url: '/user/update-password',
      params: {
        userId: Number(userId),
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword
      }
    })

    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      ElMessage.info('请记住新密码，下次登录时使用')
    } else {
      ElMessage.error(res.msg || '密码修改失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('服务器连接失败')
  } finally {
    updateLoading.value = false
  }
}

// 头像上传方法
const avatarUpload = async (options) => {
  const userId = localStorage.getItem('userId')
  if (!userId) {
    ElMessage.error('请先登录')
    return
  }
  
  const formData = new FormData()
  formData.append('userId', userId)
  formData.append('avatar', options.file)
  
  try {
    const res = await request({
      method: 'post',
      url: '/user/change-avatar',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('上传响应:', res)
    
    if (res.code === 200) {
      const avatarUrl = res.data.avatarUrl
      
      // 使用注入的方法更新头像
      updateUserInfo('avatar', avatarUrl)
      
      // 更新当前显示
      const fullAvatarUrl = avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:8080${avatarUrl}`
      userAvatar.value = fullAvatarUrl
      
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error(res.msg || '头像上传失败')
    }
  } catch (err) {
    console.error('上传失败:', err)
    ElMessage.error('上传失败：' + (err.response?.data?.msg || err.message))
  }
}

// 头像上传前校验
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片格式文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB！')
    return false
  }
  return true
}

// 初始化用户信息
const initUserInfo = async () => {
  const userId = localStorage.getItem('userId')
  const username = localStorage.getItem('username')
  
  if (!username) {
    ElMessage.warning('请先登录')
    return
  }
  
  currentUsername.value = username
  
  if (userId) {
    try {
      const res = await request({
        method: 'get',
        url: '/user/current',
        params: { userId: userId }
      })
      
      if (res.code === 200) {
        if (res.data.username) {
          currentUsername.value = res.data.username
          localStorage.setItem('username', res.data.username)
        }
        if (res.data.avatar) {
          const avatarUrl = res.data.avatar
          const fullAvatarUrl = avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:8080${avatarUrl}`
          userAvatar.value = fullAvatarUrl
          localStorage.setItem('userAvatar', avatarUrl)
        }
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
      const avatar = localStorage.getItem('userAvatar')
      if (avatar) {
        const fullAvatarUrl = avatar.startsWith('http') ? avatar : `http://localhost:8080${avatar}`
        userAvatar.value = fullAvatarUrl
      }
    }
  }
}

onMounted(() => {
  initUserInfo()
})
</script>

<style scoped>
.user-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.user-card {
  padding: 30px;
}
.section-title {
  font-size: 18px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.avatar-section {
  margin-bottom: 40px;
}
.username-section {
  margin-bottom: 40px;
}
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 20px;
}
.current-avatar {
  width: 80px;
  height: 80px;
}
.password-section {
  margin-top: 30px;
}
</style>