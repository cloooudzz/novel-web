<script setup>

</script>

<template>
  <!-- 路由出口：用来渲染所有页面（首页/登录页等），必须保留 -->
  <router-view />
</template>


<style>
/* 全局样式重置，去掉默认边距 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
}
</style>