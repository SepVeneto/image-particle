<template>
  <div
    ref="canvasRef"
    style="width: 600px; height: 500px"
  />
</template>

<script lang="ts" setup>
import { Stage } from './core/lib'
import { onMounted, ref } from 'vue'

const canvasRef = ref()

onMounted(() => {
  const node = canvasRef.value
  const stage = new Stage(node, {
    x: 300,
    y: 250,
    imgGap: 12,
    particleSize: 5,
    color: 'red',
    type: 'contain',
    origin: 'center',
    thresh: 20,
  })
  stage.start('/github.jpg')
})
</script>
