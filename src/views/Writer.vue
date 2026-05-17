<!-- Writer.vue - 简化后的申请表单 -->
<template>
  <div class="writer-page">
    <div class="writer-container">
      <div class="writer-header">
        <el-button @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h1 class="title">成为作家</h1>
        <div class="placeholder"></div>
      </div>

      <div class="writer-content">
        <div class="guide-section">
          <div class="guide-card">
            <div class="guide-icon"><el-icon :size="48"><EditPen /></el-icon></div>
            <h3>创作你的故事</h3>
            <p>把你的想象变成文字，让更多人看到你的作品。</p>
          </div>
          <div class="guide-card">
            <div class="guide-icon"><el-icon :size="48"><Money /></el-icon></div>
            <h3>获得收益</h3>
            <p>签约作品可获得稿费、打赏、订阅分成等多重收益。</p>
          </div>
          <div class="guide-card">
            <div class="guide-icon"><el-icon :size="48"><User /></el-icon></div>
            <h3>专属服务</h3>
            <p>一对一编辑指导，优先推荐资源，助你打造爆款作品。</p>
          </div>
        </div>

        <div class="form-section">
          <el-card class="form-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">作家申请</span>
                <el-tag type="warning" size="small">免费申请</el-tag>
              </div>
            </template>

            <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" label-position="top">
              <el-form-item label="笔名" prop="penName">
                <el-input v-model="form.penName" placeholder="请输入笔名（将作为作者名展示）" maxlength="20" show-word-limit />
              </el-form-item>
              <el-form-item label="联系方式" prop="contact">
                <el-input v-model="form.contact" placeholder="请输入QQ/微信/邮箱，方便编辑联系您" />
              </el-form-item>
              <el-form-item label="擅长类型" prop="genre">
                <el-select v-model="form.genre" placeholder="请选择擅长的小说类型" clearable style="width: 100%">
                  <el-option label="玄幻奇幻" value="玄幻奇幻" />
                  <el-option label="都市言情" value="都市言情" />
                  <el-option label="武侠仙侠" value="武侠仙侠" />
                  <el-option label="科幻灵异" value="科幻灵异" />
                  <el-option label="历史军事" value="历史军事" />
                  <el-option label="悬疑推理" value="悬疑推理" />
                  <el-option label="现代言情" value="现代言情" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>
              <el-form-item label="自我介绍" prop="intro">
                <el-input v-model="form.intro" type="textarea" :rows="4" placeholder="请简要介绍你的创作经历（200字以内）" maxlength="200" show-word-limit />
              </el-form-item>
              <el-form-item>
                <div class="agreement">
                  <el-checkbox v-model="agreed">
                    我已阅读并同意
                    <el-link type="primary" @click="showAgreement">《作家入驻协议》</el-link>
                  </el-checkbox>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="large" @click="submitApplication" :loading="submitting" class="submit-btn">
                  提交申请
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </div>

      <div class="writer-footer">
        <p>已有超过 <span class="highlight">10,000+</span> 位作家在本平台创作</p>
      </div>
    </div>

    <el-dialog v-model="agreementVisible" title="作家入驻协议" width="600px">
      <div class="agreement-content">
        <h4>一、总则</h4>
        <p>1. 本协议是您与小说阅读平台之间关于申请成为平台作家所订立的协议。</p>
        <p>2. 申请成为平台作家，即表示您同意遵守本协议的全部条款。</p>
        <h4>二、作家权利</h4>
        <p>1. 作家拥有其原创作品的著作权。</p>
        <p>2. 平台为作家提供作品展示、推广、收益分成等服务。</p>
        <h4>三、作家义务</h4>
        <p>1. 保证作品的原创性，不得抄袭、剽窃他人作品。</p>
        <p>2. 遵守国家法律法规，不发布违法违规内容。</p>
        <h4>四、平台服务</h4>
        <p>1. 平台为作家提供技术支持、流量推荐、编辑指导等服务。</p>
        <p>2. 平台保障作家的合法权益，打击盗版侵权行为。</p>
      </div>
      <template #footer>
        <el-button @click="agreementVisible = false">关闭</el-button>
        <el-button type="primary" @click="acceptAgreement">同意并继续</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, EditPen, Money, User } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()

const form = ref({
  penName: '',
  contact: '',
  genre: '',
  intro: ''
})
const agreed = ref(false)
const submitting = ref(false)
const agreementVisible = ref(false)
const formRef = ref(null)

const rules = {
  penName: [
    { required: true, message: '请输入笔名', trigger: 'blur' },
    { min: 2, max: 20, message: '笔名长度为2-20个字符', trigger: 'blur' }
  ],
  contact: [
    { required: true, message: '请输入联系方式', trigger: 'blur' }
  ],
  genre: [
    { required: true, message: '请选择擅长类型', trigger: 'change' }
  ],
  intro: [
    { required: true, message: '请输入自我介绍', trigger: 'blur' }
  ]
}

const goBack = () => {
  router.back()
}

const showAgreement = () => {
  agreementVisible.value = true
}

const acceptAgreement = () => {
  agreed.value = true
  agreementVisible.value = false
  ElMessage.success('已同意作家入驻协议')
}

const submitApplication = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    if (!agreed.value) {
      ElMessage.warning('请先阅读并同意作家入驻协议')
      return
    }
    
    const userId = localStorage.getItem('userId')
    if (!userId) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    submitting.value = true
    
    try {
      const res = await request.post('/author/apply', {
        userId: Number(userId),
        penName: form.value.penName,
        contact: form.value.contact,
        genre: form.value.genre,
        intro: form.value.intro
      })
      
      if (res.code === 200) {
        ElMessage.success('申请成功！您已成为作者')
        setTimeout(() => {
          router.back()
        }, 1500)
      } else {
        ElMessage.error(res.msg || '提交失败')
      }
    } catch (error) {
      console.error('提交申请失败:', error)
      ElMessage.error('提交失败，请检查网络连接')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.writer-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 20px;
}

.writer-container {
  max-width: 1400px;
  margin: 0 auto;
}

.writer-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding: 10px 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 16px;
  padding: 8px 16px;
  background: white;
}
.back-btn:hover {
  color: #e6a23c;
  background-color: #fdf6ec;
  border-color: #e6a23c;
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #e6a23c, #f5d94c);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0;
}

.placeholder { width: 100px; visibility: hidden; }

.writer-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.guide-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.guide-card {
  background: white;
  border-radius: 16px;
  padding: 28px 24px;
  text-align: center;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.guide-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(230, 162, 60, 0.15);
}

.guide-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #fdf6ec, #fef6e6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e6a23c;
}

.guide-card h3 { font-size: 20px; margin-bottom: 12px; color: #303133; }
.guide-card p { font-size: 14px; color: #909399; line-height: 1.6; }

.form-section { position: sticky; top: 20px; }
.form-card { border-radius: 16px; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 18px; font-weight: 600; }
.agreement { text-align: center; }
.submit-btn { width: 100%; height: 44px; font-size: 16px; background: linear-gradient(135deg, #e6a23c, #f5d94c); border: none; }
.submit-btn:hover { background: linear-gradient(135deg, #d8962c, #e6c93c); }

.writer-footer { text-align: center; padding: 30px; background: white; border-radius: 16px; margin-top: 20px; }
.writer-footer .highlight { color: #e6a23c; font-size: 20px; font-weight: bold; }

.agreement-content { max-height: 400px; overflow-y: auto; padding: 10px; }
.agreement-content h4 { font-size: 16px; margin: 16px 0 8px; }
.agreement-content p { font-size: 14px; color: #606266; line-height: 1.6; }

@media (max-width: 968px) {
  .writer-content { grid-template-columns: 1fr; }
  .form-section { position: static; }
  .title { font-size: 22px; position: static; transform: none; }
  .writer-header { justify-content: flex-start; gap: 20px; }
  .placeholder { display: none; }
}
</style>