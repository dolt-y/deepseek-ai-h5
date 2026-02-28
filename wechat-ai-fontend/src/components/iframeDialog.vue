<!--
 * @Description: 
 * @Author: wen.yao
 * @LastEditTime: 2025-12-11 10:32:49
-->
<template>
  <el-dialog class="container" v-model="dialogVisible" title="页面预览" width="80%" :before-close="handleClose">
    <div class="preview-container">
      <iframe v-if="content" class="preview-iframe" sandbox="allow-scripts allow-same-origin"
        :srcdoc="content"></iframe>
      <div v-else class="empty-content">
        <p>暂无内容可预览</p>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElDialog } from 'element-plus';
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  content: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const dialogVisible = ref(props.visible);

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal;
});

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal);
});

function handleClose() {
  dialogVisible.value = false;
}

defineExpose({
  dialogVisible
});
</script>

<style scoped lang="scss">
.container {
  :deep(.el-dialog) {
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, var(--color-accent, #6366f1), var(--color-accent-strong, #8b5cf6));
    color: white;
    margin: 0;
    padding: 1rem 1.5rem;

    .el-dialog__title {
      color: white;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      top: 1rem;
      right: 1.5rem;

      .el-dialog__close {
        color: white;
        font-size: 1.2rem;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.preview-container {
  width: 100%;
  height: 60vh;
  min-height: 400px;

  .preview-iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 0;
    background: white;
  }

  .empty-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: var(--color-bg-soft);

    p {
      color: var(--color-text-secondary);
      font-size: 1rem;
      margin: 0;
    }
  }
}

@media (max-width: 768px) {
  .container {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 1rem auto;
    }
  }

  .preview-container {
    height: 50vh;
    min-height: 300px;
  }
}
</style>
