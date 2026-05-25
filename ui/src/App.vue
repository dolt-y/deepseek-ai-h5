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
      <div class="chat-top">
        <div v-if="messages.length <= 1" class="welcome-hero">
          <div class="welcome-hero__head">
            <span class="welcome-badge">{{ latestVersion }}</span>
            <button type="button" class="welcome-changelog" @click="changelogVisible = true">
              版本说明
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
          <h2 class="welcome-title">准备好开始了吗？</h2>
          <p class="welcome-body">
            输入你的目标、受众和期望格式，我会帮你拆解任务并给出高质量输出建议。
          </p>
          <div class="welcome-tags">
            <span class="tag">写作灵感</span>
            <span class="tag">方案优化</span>
            <span class="tag">学习规划</span>
          </div>
        </div>
      </div>
      <div class="message-scroll">
        <MessageItem v-for="message in messages" :key="message.id" :message="message" :userInfo="userInfo"
          @regenerate="handleRegenerate" @like="handleLike" />
        <div :id="bottomAnchorId"></div>
      </div>
    </div>
    <!--输入框-->
    <div class="composer-container">
      <InputArea v-model="inputValue" :selected-model="selectedModel" :model-options="modelOptions"
        :is-assistant-typing="isAssistantTyping" :is-transcribing="isTranscribing"
        @send-message="handleSendMessage" @view-history="historySessionsVisible = true" @new-session="handleNewSession"
        @upload-image="handleUploadImage" @update:selected-model="selectedModel = $event"
        @start-recording="handleStartRecording" />
    </div>
    <!--历史会话-->
    <HistroySessions :visible="historySessionsVisible" :active-session-id="sessionId"
      @close="historySessionsVisible = false" @delete-session="handelDelete" @select-session="handleSelectSession" />
    <RecordingIndicator :is-recording="isRecording" :duration="recordingDuration" :is-transcribing="isTranscribing"
      @cancel="handleStopRecording">
    </RecordingIndicator>
    <ChangelogDialog v-model:visible="changelogVisible" />
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import InputArea from '@/components/InputArea.vue';
import MessageItem from '@/components/MessageItem.vue';
import HistroySessions from '@/components/HistroySessions.vue';
import RecordingIndicator from '@/components/RecordingIndicator.vue';
import ChangelogDialog from '@/components/ChangelogDialog.vue';
import { CHANGELOG } from '@/constants/changelog';
import { useChatRecording } from './hook/useChatRecording';
import { useChatConversation } from './hook/useChatConversation';
import { useChatAuth } from './hook/useChatAuth';

const changelogVisible = ref(false);
const latestVersion = CHANGELOG[0]?.version ?? '';

const { userInfo } = useChatAuth();
const {
  messages,
  inputValue,
  selectedModel,
  modelOptions,
  isAssistantTyping,
  sessionId,
  historySessionsVisible,
  bottomAnchorId,
  handleSendMessage,
  handleUploadImage,
  handleNewSession,
  handleSelectSession,
  handleRegenerate,
  handleLike,
  handelDelete
} = useChatConversation();
const { isRecording, recordingDuration, isTranscribing, handleStartRecording, handleStopRecording } = useChatRecording({
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
    padding: 1.25rem 0.1rem 1rem;
    gap: 1rem;
    box-sizing: border-box;

    .chat-top {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      padding: 0 1rem;
      box-sizing: border-box;
    }

    .welcome-hero {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      padding: 0.85rem 0.9rem;
      border-radius: 0.75rem;
      background: linear-gradient(145deg, rgba(99, 102, 241, 0.08) 0%, var(--color-bg-soft) 55%);
      border: 1px solid var(--color-border-soft);
      box-shadow: var(--shadow-soft);
    }

    .welcome-hero__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .welcome-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--color-accent);
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .welcome-changelog {
      display: inline-flex;
      align-items: center;
      gap: 0.1rem;
      padding: 0;
      border: none;
      background: transparent;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;

      svg {
        width: 0.875rem;
        height: 0.875rem;
        opacity: 0.7;
      }

      &:hover {
        color: var(--color-accent);
      }

      &:active {
        opacity: 0.75;
      }
    }

    .welcome-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.25;
      color: var(--color-text-primary);
      letter-spacing: 0.02em;
    }

    .welcome-body {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.55;
      color: var(--color-text-secondary);
    }

    .welcome-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.1rem;
    }

    .welcome-tags .tag {
      padding: 0.22rem 0.55rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.65);
      border: 1px solid var(--color-border-soft);
      color: var(--color-text-primary);
      font-size: 0.75rem;
      letter-spacing: 0.02em;
    }

    .message-scroll {
      flex: 1;
      padding: 0rem 1rem;
      box-sizing: border-box;

      .message-feed {
        display: flex;
        flex-direction: column;
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
