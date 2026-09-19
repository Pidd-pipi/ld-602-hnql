<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ used: number; capacity: number; label?: string }>();
const percent = computed(() =>
  props.capacity > 0 ? Math.min(100, Math.round((props.used / props.capacity) * 100)) : 0
);
</script>

<template>
  <div class="capacity">
    <div class="capacity-head">
      <span>{{ label ?? "容量" }}</span>
      <span>{{ used }} / {{ capacity }}（{{ percent }}%）</span>
    </div>
    <div class="capacity-bar"><i :style="{ width: percent + '%' }" :class="{ hot: percent >= 90 }" /></div>
  </div>
</template>
