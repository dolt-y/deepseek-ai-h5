<template>
  <el-dialog
    v-model="dialogVisible"
    class="changelog-dialog"
    title="更新说明"
    width="min(92vw, 420px)"
    align-center
    :before-close="handleClose"
  >
    <section class="section">
      <h3 class="section-title">使用提示</h3>
      <ul class="tip-list">
        <li v-for="(tip, index) in USAGE_TIPS" :key="index">{{ tip }}</li>
      </ul>
    </section>
    <section class="section">
      <h3 class="section-title">更新记录</h3>
      <div v-for="entry in CHANGELOG" :key="entry.version" class="log-block">
        <div class="log-head">
          <span class="log-version">{{ entry.version }}</span>
          <span class="log-date">{{ entry.date }}</span>
        </div>
        <ul class="log-list">
          <li v-for="(item, index) in entry.items" :key="index">{{ item }}</li>
        </ul>
      </div>
    </section>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElDialog } from 'element-plus';
import { ref, watch } from 'vue';
import { CHANGELOG, USAGE_TIPS } from '@/constants/changelog';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const dialogVisible = ref(props.visible);

watch(
  () => props.visible,
  (value) => {
    dialogVisible.value = value;
  }
);

watch(dialogVisible, (value) => {
  emit('update:visible', value);
});

function handleClose() {
  dialogVisible.value = false;
}
</script>

<style scoped lang="scss">
.changelog-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow-strong);
  }

  :deep(.el-dialog__header) {
    margin: 0;
    padding: 0.85rem 1rem;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong));

    .el-dialog__title {
      color: var(--color-text-inverse);
      font-size: 0.95rem;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      top: 0.85rem;
      right: 1rem;

      .el-dialog__close {
        color: var(--color-text-inverse);
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0.75rem 1rem 1rem;
    max-height: 60vh;
    overflow-y: auto;
  }
}

.section + .section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-soft);
}

.section-title {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
}

.tip-list,
.log-list {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.85rem;
  color: var(--color-text-primary);
  line-height: 1.55;

  li + li {
    margin-top: 0.35rem;
  }
}

.log-block + .log-block {
  margin-top: 0.65rem;
}

.log-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.log-version {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-accent);
}

.log-date {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
</style>
