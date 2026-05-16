<template>
  <div class="comment-section">
    <!-- 评论头部 -->
    <div class="comment-header">
      <h3>
        <el-icon><ChatDotRound /></el-icon>
        章节评论 ({{ commentCount }})
      </h3>
      <div class="header-actions">
        <el-radio-group v-model="sortType" size="small" @change="handleSortChange">
          <el-radio-button value="latest">最新</el-radio-button>
          <el-radio-button value="hot">最热</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 评论输入框 -->
    <div class="comment-input-area" v-if="isLogin">
      <el-avatar :src="userAvatar" class="comment-avatar" />
      <div class="input-wrapper">
        <el-input
          v-model="newComment"
          type="textarea"
          :rows="3"
          placeholder="写下你的想法..."
          maxlength="500"
          show-word-limit
        />
        <div class="input-actions">
          <el-button 
            type="primary" 
            @click="submitComment" 
            :loading="submitting"
            :disabled="!newComment.trim()"
          >
            发表评论
          </el-button>
        </div>
      </div>
    </div>
    <div v-else class="login-tip">
      <el-empty description="登录后参与讨论" :image-size="60">
        <el-button type="primary" @click="$router.push('/login')">立即登录</el-button>
      </el-empty>
    </div>

    <!-- 评论列表 -->
    <div class="comment-list" v-if="comments.length > 0">
      <div 
        v-for="comment in comments" 
        :key="comment.id" 
        class="comment-item"
        :id="`comment-${comment.id}`"
      >
        <!-- 评论主体 -->
        <div class="comment-main">
          <el-avatar :src="getAvatarUrl(comment.userAvatar)" class="comment-avatar" />
          <div class="comment-content">
            <div class="comment-user">
              <span class="username">{{ comment.username }}</span>
              <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
            </div>
            <div class="comment-text">{{ comment.content }}</div>
            <div class="comment-actions">
              <span class="action-btn" @click="toggleReply(comment.id)">
                <el-icon><ChatLineRound /></el-icon>
                回复 ({{ comment.replyCount || 0 }})
              </span>
              <span 
                class="action-btn like-btn" 
                :class="{ liked: comment.isLiked }"
                @click="handleLike(comment.id)"
              >
                <el-icon><Star /></el-icon>
                {{ formatLikeCount(comment.likeCount) }}
              </span>
              <span 
                v-if="comment.userId === currentUserId"
                class="action-btn delete-btn"
                @click="handleDelete(comment.id)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </span>
            </div>
            
            <!-- 回复输入框 -->
            <div v-if="replyingTo === comment.id" class="reply-input">
              <el-input
                ref="replyInputRef"
                v-model="replyContent"
                type="textarea"
                :rows="2"
                :placeholder="`回复 @${comment.username}`"
                maxlength="500"
                @keyup.ctrl.enter="submitReply(comment.id)"
              />
              <div class="reply-actions">
                <el-button size="small" @click="cancelReply">取消</el-button>
                <el-button size="small" type="primary" @click="submitReply(comment.id)" :loading="submittingReply">
                  回复 (Ctrl+Enter)
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 回复列表 -->
        <div class="replies-list" v-if="replies[comment.id] && replies[comment.id].length > 0">
          <div 
            v-for="reply in displayReplies(comment.id)" 
            :key="reply.id" 
            class="reply-item"
          >
            <el-avatar :src="getAvatarUrl(reply.userAvatar)" class="reply-avatar" size="small" />
            <div class="reply-content">
              <div class="reply-user">
                <span class="username">{{ reply.username }}</span>
                <span v-if="reply.replyToUsername" class="reply-to">
                  回复 @{{ reply.replyToUsername }}
                </span>
                <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
              </div>
              <div class="reply-text">{{ reply.content }}</div>
              <div class="reply-actions">
                <span class="action-btn" @click="toggleReplyToReply(comment.id, reply)">
                  <el-icon><ChatLineRound /></el-icon>
                  回复
                </span>
                <span 
                  class="action-btn like-btn" 
                  :class="{ liked: reply.isLiked }"
                  @click="handleLike(reply.id)"
                >
                  <el-icon><Star /></el-icon>
                  {{ formatLikeCount(reply.likeCount) }}
                </span>
                <span 
                  v-if="reply.userId === currentUserId"
                  class="action-btn delete-btn"
                  @click="handleDelete(reply.id)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </span>
              </div>
              
              <!-- 回复中的回复输入框 -->
              <div v-if="replyingToReply === reply.id" class="reply-input">
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  :placeholder="`回复 @${reply.username}`"
                  maxlength="500"
                  @keyup.ctrl.enter="submitReplyToReply(comment.id, reply.id, reply.username)"
                />
                <div class="reply-actions">
                  <el-button size="small" @click="cancelReply">取消</el-button>
                  <el-button size="small" type="primary" @click="submitReplyToReply(comment.id, reply.id, reply.username)" :loading="submittingReply">
                    回复
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 查看更多回复按钮 -->
          <div v-if="hasMoreReplies(comment.id)" class="view-more-replies" @click="loadMoreReplies(comment.id)">
            <el-icon><More /></el-icon>
            查看全部{{ replies[comment.id].length }}条回复
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="!loading && comments.length === 0" description="暂无评论，快来抢沙发吧~" :image-size="80" />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-comments">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="totalPages > 1">
    <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="commentCount"
        layout="prev, pager, next"
        @current-change="handlePageChange"
    />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, ChatLineRound, Delete, More, Star } from '@element-plus/icons-vue'
import request from '@/utils/request'

const props = defineProps({
  novelId: {
    type: Number,
    required: true
  },
  chapterNum: {
    type: Number,
    required: true
  }
})

// ==================== 用户信息 ====================
const isLogin = computed(() => !!localStorage.getItem('userId'))
const currentUserId = computed(() => localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null)
const userAvatar = computed(() => {
  const avatar = localStorage.getItem('userAvatar')
  return getAvatarUrl(avatar)
})

const getAvatarUrl = (avatar) => {
  if (!avatar || avatar === 'null' || avatar === 'undefined') return 'https://picsum.photos/id/64/100/100'
  if (avatar.startsWith('http')) return avatar
  if (avatar.startsWith('/')) return `http://localhost:8080${avatar}`
  return 'https://picsum.photos/id/64/100/100'
}

// ==================== 数据状态 ====================
const loading = ref(false)
const comments = ref([])
const replies = ref({})
const commentCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(0)
const sortType = ref('hot') // latest, hot

// ==================== 回复限制 ====================
const INITIAL_REPLY_LIMIT = 3
const replyLimits = ref({})

const displayReplies = (commentId) => {
  const allReplies = replies.value[commentId] || []
  const limit = replyLimits.value[commentId] || INITIAL_REPLY_LIMIT
  return allReplies.slice(0, limit)
}

const hasMoreReplies = (commentId) => {
  const allReplies = replies.value[commentId] || []
  const limit = replyLimits.value[commentId] || INITIAL_REPLY_LIMIT
  return allReplies.length > limit
}

const loadMoreReplies = (commentId) => {
  replyLimits.value[commentId] = replies.value[commentId].length
}

// ==================== 评论输入 ====================
const newComment = ref('')
const submitting = ref(false)

// ==================== 回复相关 ====================
const replyingTo = ref(null)
const replyingToReply = ref(null)
const replyContent = ref('')
const submittingReply = ref(false)
const replyInputRef = ref(null)

// ==================== API 调用 ====================

// 获取评论列表
// 获取评论列表
const fetchComments = async () => {
  loading.value = true
  try {
    const params = {
      novelId: props.novelId,
      chapterNum: props.chapterNum,
      page: currentPage.value,
      pageSize: pageSize.value,
      sortType: sortType.value
    }
    if (currentUserId.value) {
      params.userId = currentUserId.value
    }
    
    const res = await request.get('/comment/list', { params })
    
    if (res && typeof res === 'object') {
      const commentsData = res.comments || []
      commentCount.value = res.total || 0
      totalPages.value = Math.ceil(commentCount.value / pageSize.value)
      
      // 根据排序类型处理
      if (sortType.value === 'latest') {
        comments.value = [...commentsData].sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      } else {
        comments.value = [...commentsData].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      }
      
      // 重置回复限制
      replyLimits.value = {}
      
      // 加载回复
      for (const comment of comments.value) {
        const replyKey = `replies_${comment.id}`
        const replyList = res[replyKey] || []
        replies.value[comment.id] = replyList
        replyLimits.value[comment.id] = INITIAL_REPLY_LIMIT
      }
    } else {
      ElMessage.error('获取评论失败')
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    ElMessage.error('加载评论失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  submitting.value = true
  try {
    const res = await request.post('/comment/add', {
      userId: currentUserId.value,
      novelId: props.novelId,
      chapterNum: props.chapterNum,
      content: newComment.value.trim()
    })
    
    if (res.code === 200) {
      ElMessage.success('评论成功')
      newComment.value = ''
      await fetchComments()
    } else {
      ElMessage.error(res.msg || '评论失败')
    }
  } catch (error) {
    console.error('评论失败:', error)
    ElMessage.error('评论失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 切换回复框
const toggleReply = (commentId) => {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return
  }
  if (replyingTo.value === commentId) {
    replyingTo.value = null
    replyContent.value = ''
  } else {
    replyingTo.value = commentId
    replyingToReply.value = null
    replyContent.value = ''
    // 使用双重 nextTick 确保 DOM 完全渲染
    nextTick(() => {
      nextTick(() => {
        if (replyInputRef.value) {
          // 尝试获取 textarea
          const textarea = replyInputRef.value.$el?.querySelector('textarea') || 
                           replyInputRef.value.querySelector?.('textarea')
          if (textarea) {
            textarea.focus()
          }
        }
      })
    })
  }
}

// 回复评论的回复
const toggleReplyToReply = (commentId, reply) => {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return
  }
  if (replyingToReply.value === reply.id) {
    replyingToReply.value = null
    replyContent.value = ''
  } else {
    replyingToReply.value = reply.id
    replyingTo.value = null
    replyContent.value = `@${reply.username} `
  }
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
  replyingToReply.value = null
  replyContent.value = ''
}

// 提交回复
const submitReply = async (parentId) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  // 去除@前缀（如果有）
  let content = replyContent.value.trim()
  if (content.startsWith('@')) {
    const atIndex = content.indexOf(' ')
    if (atIndex !== -1) {
      content = content.substring(atIndex + 1).trim()
    }
  }
  
  if (!content) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  submittingReply.value = true
  try {
    const res = await request.post('/comment/add', {
      userId: currentUserId.value,
      novelId: props.novelId,
      chapterNum: props.chapterNum,
      content: content,
      parentId: parentId
    })
    
    if (res.code === 200) {
      ElMessage.success('回复成功')
      cancelReply()
      await fetchComments()
    } else {
      ElMessage.error(res.msg || '回复失败')
    }
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败，请稍后重试')
  } finally {
    submittingReply.value = false
  }
}

// 提交回复给回复
const submitReplyToReply = async (parentId, replyToId, replyToUsername) => {
  await submitReply(parentId)
}

// 点赞
const handleLike = async (commentId) => {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    const res = await request.post('/comment/like', {
      commentId: commentId,
      userId: currentUserId.value
    })
    
    if (res.code === 200) {
      updateCommentLikeStatus(commentId, res.liked)
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 更新评论点赞状态
const updateCommentLikeStatus = (commentId, liked) => {
  // 查找顶层评论
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    comment.isLiked = liked
    comment.likeCount = (comment.likeCount || 0) + (liked ? 1 : -1)
    return
  }
  
  // 查找回复
  for (const key in replies.value) {
    const reply = replies.value[key].find(r => r.id === commentId)
    if (reply) {
      reply.isLiked = liked
      reply.likeCount = (reply.likeCount || 0) + (liked ? 1 : -1)
      break
    }
  }
}

// 删除评论
const handleDelete = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  
  try {
    const res = await request.delete('/comment/delete', {
      params: {
        commentId: commentId,
        userId: currentUserId.value
      }
    })
    
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await fetchComments()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败，请稍后重试')
  }
}

// 格式化点赞数
const formatLikeCount = (count) => {
  if (!count) return '0'
  if (count >= 10000) return (count / 10000).toFixed(1) + 'w'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k'
  return count.toString()
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

// ==================== 事件处理 ====================
const handleSortChange = () => {
  currentPage.value = 1
  fetchComments()
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchComments()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ==================== 监听章节变化 ====================
watch(() => props.chapterNum, () => {
  currentPage.value = 1
  fetchComments()
})

// ==================== 初始化 ====================
onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comment-section {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  width: 100%;           /* 添加：占满宽度 */
  text-align: left;      /* 添加：文本左对齐 */
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.comment-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  margin: 0;
  color: #303133;
}

.comment-input-area {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.input-wrapper {
  flex: 1;
}

.input-actions {
  margin-top: 12px;
  text-align: right;
}

.login-tip {
  margin: 30px 0;
}

.comment-list {
  margin-top: 20px;
}

.comment-item {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-main {
  display: flex;
  gap: 16px;
}

.comment-content {
  flex: 1;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.username {
  font-weight: 600;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #c0c4cc;
}

.comment-text {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 10px;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #409eff;
}

.like-btn.liked {
  color: #409eff;
}

.delete-btn:hover {
  color: #f56c6c;
}

.replies-list {
  margin-top: 16px;
  margin-left: 56px;
  padding-left: 20px;
  border-left: 2px solid #ebeef5;
}

.reply-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-avatar {
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
}

.reply-user {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.reply-to {
  font-size: 12px;
  color: #909399;
}

.reply-time {
  font-size: 11px;
  color: #c0c4cc;
}

.reply-text {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 8px;
  word-break: break-word;
}

.reply-actions {
  display: flex;
  gap: 16px;
}

.reply-input {
  margin-top: 12px;
}

.reply-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.loading-comments {
  padding: 40px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.view-more-replies {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 13px;
  color: #409eff;
  cursor: pointer;
  background: #f5f7fa;
  border-radius: 6px;
  transition: all 0.2s;
}

.view-more-replies:hover {
  background: #ecf5ff;
  color: #66b1ff;
}

/* 响应式 */
@media (max-width: 768px) {
  .replies-list {
    margin-left: 0;
    padding-left: 12px;
  }
  
  .comment-actions {
    gap: 12px;
  }
  
  .reply-item {
    padding: 10px;
  }
}
</style>