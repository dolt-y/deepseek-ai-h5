<template>
  <div class="chat-container">
    <!--背景渐变-->
    <div class="page-background">
      <div class="bg-gradient"></div>
      <div class="bg-glow-left"></div>
      <div class="bg-glow-right"></div>
      <div class="bg-noise"></div>
    </div>
    <!--聊天窗口-->
    <div class="chat-body">
      <div class="message-scroll">
        <div class="message-feed">
          <div v-if="messages.length <= 1" class="welcome-card">
            <span class="welcome-title">准备好开始了吗？</span>
            <p class="welcome-body">
              输入你的目标、受众和期望格式，我会帮你拆解任务并给出高质量输出建议。
            </p>
            <div class="welcome-tags">
              <div class="tag">写作灵感</div>
              <div class="tag">方案优化</div>
              <div class="tag">学习规划</div>
            </div>
          </div>
        </div>
        <MessageItem v-for="message in messages" :key="message.id" :message="message" :userInfo="userInfo"
          @regenerate="handleRegenerate" @like="handleLike" />
        <div :id="bottomAnchorId"></div>
      </div>
    </div>
    <!--输入框-->
    <div class="composer-container">
      <InputArea v-model="inputValue" :selected-model="selectedModel" :model-options="modelOptions"
        @send-message="handleSendMessage" @view-history="historySessionsVisible = true" @new-session="handleNewSession"
        @update:selected-model="selectedModel = $event" @settings="handleSettings"
        @stop-recording="handleStartRecording" />
    </div>
    <!--历史会话-->
    <HistroySessions :visible="historySessionsVisible" :active-session-id="sessionId"
      @close="historySessionsVisible = false" @delete-session="handelDelete" @select-session="handleSelectSession" />
    <RecordingIndicator :is-recording="isRecording" :duration="recordingDuration" :is-cancel="isCancel"
      @cancel="handleStopRecording">
    </RecordingIndicator>
  </div>
</template>
<script lang="ts" setup>
import InputArea from '@/components/InputArea.vue';
import MessageItem from '@/components/MessageItem.vue';
import HistroySessions from '@/components/HistroySessions.vue';
import RecordingIndicator from '@/components/RecordingIndicator.vue';
import { useChatRecording } from './hook/useChatRecording';
import { useChatConversation } from './hook/useChatConversation';
import { useChatAuth } from './hook/useChatAuth';

const { userInfo } = useChatAuth();
const {
  messages,
  inputValue,
  selectedModel,
  modelOptions,
  sessionId,
  historySessionsVisible,
  bottomAnchorId,
  handleSendMessage,
  handleNewSession,
  handleSelectSession,
  handleRegenerate,
  handleLike,
  handleSettings,
  handelDelete
} = useChatConversation();
const { isRecording, recordingDuration, isCancel, handleStartRecording, handleStopRecording } = useChatRecording({
  onRecognized: (text) => {
    inputValue.value = inputValue.value ? `${inputValue.value}${text}` : text;
  }
});
</script>
<style scoped lang="scss">
.chat-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .page-background {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;

    .bg-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-card) 60%, var(--color-bg-primary) 100%);
    }

    .bg-glow-left {
      position: absolute;
      top: -120px;
      left: -80px;
      width: 360px;
      height: 360px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%);
    }

    .bg-glow-right {
      position: absolute;
      bottom: 120px;
      right: -120px;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.16) 0%, transparent 70%);
    }

    .bg-noise {
      position: absolute;
      inset: 0;
      opacity: 0.06;
      background-image: linear-gradient(90deg, rgba(99, 102, 241, 0.12) 1px, transparent 0), linear-gradient(rgba(129, 140, 248, 0.12) 1px, transparent 0);
      background-size: 24px 24px;
      mix-blend-mode: soft-light;
    }
  }

  .chat-body {
    height: 70vh;
    width: 95vw;
    overflow-y: auto;
    z-index: 1;
    display: flex;
    flex-direction: column;
    padding: 2rem 0.1rem 1rem;
    gap: 2rem;
    box-sizing: border-box;

    .message-scroll {
      flex: 1;
      padding: 0rem 1rem;
      box-sizing: border-box;

      .message-feed {
        display: flex;
        flex-direction: column;
      }

      .welcome-card {
        display: flex;
        flex-direction: column;
        padding: 1rem 1rem;
        border-radius: 12px;
        background: var(--color-bg-soft);
        border: 1px solid var(--color-border-soft);
        box-shadow: var(--shadow-soft);
      }

      .welcome-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--color-text-primary);
        letter-spacing: 0.8px;
      }

      .welcome-body {
        font-size: 1rem;
        color: var(--color-text-secondary);
      }

      .welcome-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .welcome-tags .tag {
        padding: 0.3rem 0.6rem;
        border-radius: 999px;
        background: rgba(99, 102, 241, 0.12);
        color: var(--color-text-primary);
        font-size: 0.9rem;
        letter-spacing: 0.6px;
      }
    }
  }

  .composer-container {
    position: fixed;
    bottom: 0;
    padding: 0 2rem 2.5rem;
    background: linear-gradient(180deg, transparent 0%, var(--color-bg-primary) 60%, var(--color-bg-card) 100%);
    backdrop-filter: blur(1.2rem);
    -webkit-backdrop-filter: blur(1.2rem);
    z-index: 2;
  }
}
</style>
