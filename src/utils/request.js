import axios from 'axios'
import { ElMessage } from 'element-plus'

const isLocalDev = window.location.port === '5173' || 
                   document.querySelector('script[src*="/@vite/"]') !== null

const service = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 清除登录信息并跳转
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('username')
  localStorage.removeItem('account')
  localStorage.removeItem('userAvatar')
  window.location.href = '/login'
}

// 判断是否为登录相关接口
const isLoginApi = (url) => {
  return url && (url.includes('/user/login') || url.includes('/user/register'))
}

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    const requestUrl = response.config.url || ''
    
    // 登录/注册接口：直接返回，不处理 401 跳转
    if (isLoginApi(requestUrl)) {
      return res
    }
    
    // 其他接口处理业务状态码 401（未登录/token过期）
    if (res.code === 401) {
      ElMessage.error(res.msg || '登录已过期，请重新登录')
      handleLogout()
      return Promise.reject(new Error(res.msg || '未登录'))
    }
    
    return res
  },
  error => {
    const requestUrl = error.config?.url || ''
    
    // 登录/注册接口：直接返回错误，不跳转
    if (isLoginApi(requestUrl)) {
      return Promise.reject(error)
    }
    
    // HTTP 状态码 401
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      handleLogout()
    } else if (error.response?.status === 403) {
      ElMessage.error('没有访问权限')
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器异常，请稍后重试')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default service