<script setup lang="ts">
defineProps<{ text?: string }>();
</script>

<template>
  <div class="empty">{{ text ?? "暂无数据" }}</div>
</template>
