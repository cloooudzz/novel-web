import axios from 'axios'

// 更精确的判断：检查是否正在开发模式（有 /@vite/ 标识）
const isLocalDev = window.location.port === '5173' || 
                   document.querySelector('script[src*="/@vite/"]') !== null

const service = axios.create({
  baseURL:'/api',
  timeout: 10000
})

// 请求拦截器（保持不变）
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

// 2. 核心修改：响应拦截器，只在真·网络错误时reject
service.interceptors.response.use(
  response => {
    const res = response.data
    // 直接返回完整结果，不在这里拦截code，让页面自己处理业务错误
    return res
  },
  error => {
    // 只有网络错误、超时、500服务器崩溃时，才触发catch
    return Promise.reject(error)
  }
)

export default service