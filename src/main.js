import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'


router.beforeEach((to, from, next) => {
  // 如果 去的是小说详情页，并且 不是从阅读页过来的
  if (to.path.startsWith('/novelDetail/') && !from.path.startsWith('/read/')) {
    sessionStorage.setItem('prevRoute', from.path)
  }
  next()
})


// 创建 app
const app = createApp(App)

// 挂载所有依赖
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 挂载到 #app
app.mount('#app')