<template>
  <div class="rank">
    <h2 class="title">热门排行榜</h2>
    <div class="rank-item" v-for="(item, index) in rankList" :key="item.id">
      <span class="num" :class="{top3: index<3}">{{ index + 1 }}</span>
      <span class="title-text">{{ item.title }}</span>
      <span class="author-text">{{ item.author }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const rankList = ref([
  { id:1, title:'武动乾坤', author:'天蚕土豆' },
  { id:2, title:'我真没想重生啊', author:'柳暗花又明' },
  { id:3, title:'万古神帝', author:'飞天鱼' },
  { id:4, title:'雪鹰领主', author:'我吃西红柿' },
  { id:5, title:'斗破苍穹', author:'天蚕土豆' },
  { id:6, title:'全职法师', author:'乱' },
])
</script>

<style scoped>
.title { font-size:20px; margin-bottom:20px; }
.rank-item {
  display:flex; align-items:center; padding:12px 16px;
  background:#fff; border-radius:8px; margin-bottom:10px;
}
.num {
  width:26px; height:26px; background:#ccc; color:#fff;
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  margin-right:12px; font-size:12px;
}
.num.top3 { background:#409eff; }
.title-text { flex:1; }
.author-text { color:#999; font-size:12px; }
</style>