<template>
    <div class="message-item"
        :class="{ 'ai-message': message.role === 'assistant', 'user-message': message.role === 'user' }"
        :id="`message-${message.id}`">
        <div class="avatar">
            <img class="avatar-img" :src="message.role === 'assistant' ? logo : userInfo.avatarUrl" alt="头像">
        </div>
        <div class="message-wrapper">
            <div class="message-header">
                <div v-if="message.role === 'assistant'" class="message-name">喜多川海梦</div>
                <div v-else class="message-name">{{ userInfo.nickname }}</div>
                <text class="message-time">{{ formatTime(message.timestamp) }}</text>
            </div>
            <div class="message-bubble">
                <div v-if="message.type === 'text'" class="message-content markdown-content">
                    <div v-if="message.role === 'assistant' && message.status === 'pending'" class="thinking-indicator">
                        <img src="../assets/thinking-icon.svg" alt="思考中" class="thinking-icon" />
                        <span class="thinking-text">思考中</span>
                    </div>
                    <div v-else>
                        <!-- 推理内容折叠框 -->
                        <div v-if="message.reasoning_content" class="reasoning-section">
                            <button class="reasoning-header" @click="toggleReasoningContent">
                                <svg class="reasoning-icon" :class="{ expanded: !isReasoningExpanded }" width="1rem"
                                    height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                                <span class="reasoning-label">🧠 深度思考</span>
                                <span class="reasoning-length">{{ reasoningContentPreview }}</span>
                            </button>
                            <transition name="expand">
                                <div v-show="isReasoningExpanded" class="reasoning-content markdown-content">
                                    <div v-html="renderedReasoningHtml"></div>
                                </div>
                            </transition>
                        </div>
                        <div v-html="renderedHtml" class="markdown-content"></div>
                    </div>
                </div>
                <div v-else-if="message.type === 'image'" class="message-image" @click="predivImage(message.content)">
                    <image :src="message.content" mode="aspectFill"></image>
                    <div class="image-overlay"></div>
                </div>
            </div>
            <div class="message-footer">
                <div class="message-actions"
                    v-if="message.type === 'text' && message.status === 'done' && message.role === 'assistant'">
                    <div class="actions-left">
                        <div class="action-btn copy-btn" @click="handleCopy" :class="{ 'copied': isCopied }" title="复制">
                            <img src="../assets/copy-icon.svg" alt="复制" />
                        </div>
                        <div class="action-btn like-btn" @click="handleLike" :class="{ 'liked': isLiked }" title="点赞">
                            <img src="../assets/like-icon.svg" alt="点赞" />
                        </div>
                        <div class="action-btn regenerate-btn" @click="handleRegenerate" title="重新生成">
                            <img src="../assets/regenerate-icon.svg" alt="重新生成" />
                        </div>
                    </div>
                </div>

                <div v-if="showStatus" class="status-pill" :class="statusClass">
                    <div v-if="message.status === 'pending'" class="status-spinner"></div>
                    <text class="status-text">{{ statusText }}</text>
                </div>
            </div>
        </div>
    </div>
    <iframeDialog v-model:visible="previewDialogVisible" :content="previewContent" />
</template>
<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import logo from '@/assets/logo.png';
import "highlight.js/styles/github.css";
import { formatTime } from '@/utils/tools';
import { renderMarkdown } from '@/utils/markdown';
import { ElMessage } from 'element-plus';
import IframeDialog from './iframeDialog.vue';
const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    userInfo: {
        type: Object,
        required: true
    }
});
const isCopied = ref(false);
const isLiked = ref(false);
const isReasoningExpanded = ref(true);

const previewDialogVisible = ref(false);
const previewContent = ref('');

const emit = defineEmits(['preview-image', 'regenerate', 'quote', 'share', 'like']);

function handleCopy() {
    const text = document.getElementById(`message-${props.message.id}`)?.querySelector('.message-content')?.textContent;
    if (!text) return;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);

    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    if (isCopied) {
        isCopied.value = true;
        setTimeout(() => isCopied.value = false, 1500);
    }
}
function addCodeButtons() {
    nextTick(() => {
        const messageEl = document.getElementById(`message-${props.message.id}`);
        if (!messageEl) return;

        const pres = messageEl.querySelectorAll('pre');

        pres.forEach((pre) => {
            // if (pre.parentElement?.querySelector('.copy-code-btn')) return;

            // 包裹 pre
            const wrapper = document.createElement('div');
            wrapper.className = 'code-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.overflowX = 'auto';
            wrapper.style.display = 'block';

            pre.parentNode?.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const codeEl = pre.querySelector('code');
            // const isHTML = codeEl?.className.includes('language-html');
            const isHTML = true;

            // 复制按钮
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-code-btn';
            copyBtn.textContent = '复制';
            copyBtn.onclick = () => {
                if (!codeEl) return;
                navigator.clipboard.writeText(codeEl.textContent || '').then(() => {
                    ElMessage.success('复制成功');
                });
            };
            Object.assign(copyBtn.style, {
                position: 'absolute',
                top: '24px',
                right: isHTML ? '60px' : '8px',
                padding: '2px 6px',
                fontSize: '12px',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '4px',
                background: '#6366f1',
                color: '#fff',
                opacity: '0.7',
                zIndex: '10',
                transition: 'opacity 0.2s',
            });
            copyBtn.onmouseenter = () => (copyBtn.style.opacity = '1');
            copyBtn.onmouseleave = () => (copyBtn.style.opacity = '0.7');
            wrapper.appendChild(copyBtn);

            if (isHTML) {
                const previewBtn = document.createElement('button');
                previewBtn.className = 'preview-code-btn';
                previewBtn.textContent = '预览';
                previewBtn.onclick = () => {
                    console.log('preview');
                    if (!codeEl) return;
                    console.log(codeEl.textContent);
                    previewContent.value = codeEl.textContent || '';
                    previewDialogVisible.value = true;
                };

                Object.assign(previewBtn.style, {
                    position: 'absolute',
                    top: '24px',
                    right: '8px',
                    padding: '2px 6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#10b981',
                    color: '#fff',
                    opacity: '0.7',
                    zIndex: '10',
                    transition: 'opacity 0.2s',
                });

                previewBtn.onmouseenter = () => (previewBtn.style.opacity = '1');
                previewBtn.onmouseleave = () => (previewBtn.style.opacity = '0.7');

                wrapper.appendChild(previewBtn);
            }

        });
    });
}
function handleLike() {
    isLiked.value = !isLiked.value;
    emit('like', { messageId: props.message.id, liked: isLiked.value });
}

function handleRegenerate() {
    emit('regenerate', props.message.id);
}

function toggleReasoningContent() {
    isReasoningExpanded.value = !isReasoningExpanded.value;
}

function predivImage(imageUrl: any) {
    emit('preview-image', imageUrl);
}

function getStatusText(status: string) {
    if (status === 'pending') return '发送中';
    if (status === 'error') return '发送失败';
    return '已送达';
}

const renderedHtml = ref('');
const renderedReasoningHtml = ref('');
let latestContent = '';
let latestReasoningContent = '';
let renderFrame: number | null = null;
let reasoningRenderFrame: number | null = null;

function scheduleRender() {
    if (renderFrame !== null) return;
    renderFrame = requestAnimationFrame(() => {
        renderFrame = null;
        renderedHtml.value = renderMarkdown(latestContent);
    });
}

function scheduleReasoningRender() {
    if (reasoningRenderFrame !== null) return;
    reasoningRenderFrame = requestAnimationFrame(() => {
        reasoningRenderFrame = null;
        renderedReasoningHtml.value = renderMarkdown(latestReasoningContent);
    });
}

const reasoningContentPreview = computed(() => {
    if (!props.message.reasoning_content) return '';
    const length = props.message.reasoning_content.length;
    if (length > 1000) return `(${Math.round(length / 100) * 100} 字)`;
    return `(${length} 字)`;
});

watch(() => props.message.content, (newContent) => {
    latestContent = newContent || '';
    scheduleRender();
}, { immediate: true });

watch(() => props.message.reasoning_content, (newReasoningContent) => {
    latestReasoningContent = newReasoningContent || '';
    if (newReasoningContent) {
        scheduleReasoningRender();
    }
}, { immediate: true });

onBeforeUnmount(() => {
    if (renderFrame !== null) {
        cancelAnimationFrame(renderFrame);
    }
    if (reasoningRenderFrame !== null) {
        cancelAnimationFrame(reasoningRenderFrame);
    }
});

const showStatus = computed(() => props.message.role === 'user');
const statusText = computed(() => getStatusText(props.message.status));
const statusClass = computed(() => props.message.status || 'success');
watch(() => renderedHtml.value, () => addCodeButtons());
watch(() => renderedReasoningHtml.value, () => addCodeButtons());
</script>
<style lang="scss" scoped>
.message-item {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 0;
    animation: messageSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

    // box-sizing: border-box;
    .avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        flex-shrink: 0;
        overflow: hidden;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        border: 3px solid rgba(255, 255, 255, 0.8);

        .avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .message-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: calc(100% - 64px);
    }

    .message-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0 4px;

        .message-name {
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .message-time {
            color: rgba(0, 0, 0, 0.45);
            letter-spacing: 0.3px;
        }
    }

    .message-bubble {
        display: flex;
        justify-items: center;
        align-items: center;
        justify-content: center;
        padding: 0rem 1rem;
        border-radius: 20px 20px 20px 4px;
        word-wrap: break-word;
        word-break: break-word;
        white-space: normal;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        overflow-x: auto;

        &:active {
            transform: translateY(2px);
        }
    }

    &.user-message {
        flex-direction: row-reverse;

        .message-wrapper {
            align-items: flex-end;
        }

        .message-header {
            flex-direction: row-reverse;

            .message-time {
                color: rgba(0, 0, 0, 0.5);
            }
        }

        .message-bubble {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            border-radius: 20px 20px 4px 20px;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .avatar {
            border-color: rgba(102, 126, 234, 0.3);
        }

        .message-footer {
            flex-direction: row-reverse;
        }
    }

    &.ai-message {
        .message-bubble {
            background: #ffffff;
            color: #1f2937;
            border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .avatar {
            border-color: rgba(99, 102, 241, 0.3);
        }
    }

    .message-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 0 4px;
    }

    .message-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 16px;

        .actions-left {
            display: flex;
            gap: 16px;
            align-items: center;
        }

        .actions-right {
            display: flex;
            gap: 16px;
            align-items: center;
            margin-left: auto;
        }

        .action-btn {
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-bg-soft);
            border: 1px solid var(--color-border-soft);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            flex-shrink: 0;
            box-shadow: var(--shadow-soft);

            img {
                width: 1rem;
                height: 1rem;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }

            &:hover {
                background: var(--color-bg-elevated);
                border-color: var(--color-accent);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);

                img {
                    opacity: 1;
                }
            }

            &:active {
                transform: scale(0.92);
            }

            &.copy-btn {
                &.copied {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%);
                    border-color: rgba(16, 185, 129, 0.3);
                    animation: successPulse 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);

                    img {
                        opacity: 1;
                    }
                }
            }

            &.like-btn {
                &.liked {
                    background: linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.2) 100%);
                    border-color: rgba(236, 72, 153, 0.3);

                    img {
                        opacity: 1;
                        filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.4));
                    }
                }
            }

            &.regenerate-btn {
                &:active {
                    animation: rotate360 0.6s ease-out;
                }
            }
        }
    }

    .status-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0.3rem 0.6rem;
        border-radius: 24px;
        font-weight: 500;
        white-space: nowrap;
        flex-shrink: 0;
        margin-top: 4px;

        &.pending {
            background: rgba(99, 102, 241, 0.12);
            color: #6366f1;
        }

        &.success {
            background: rgba(16, 185, 129, 0.12);
            color: #059669;
        }

        &.done {
            background: rgba(16, 185, 129, 0.12);
            color: #059669;
        }

        &.error {
            background: rgba(239, 68, 68, 0.12);
            color: #dc2626;
        }

        .status-text {
            font-size: 0.6rem;
            letter-spacing: 0.5px;
        }
    }

    .status-spinner {
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
        border: 3px solid currentColor;
        border-top-color: transparent;
        animation: spinner 0.8s linear infinite;
    }

    .markdown-content {
        width: 100%;
        line-height: 1.8;
        color: inherit;

        :deep(h1) {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 24px 0 16px;
        }

        :deep(h2) {
            font-size: 1.4rem;
            font-weight: 600;
            margin: 20px 0 12px;
        }

        :deep(h3) {
            font-size: 1.3rem;
            font-weight: 500;
            margin: 16px 0 8px;
        }

        :deep(h4) {
            font-size: 1.2rem;
            font-weight: 500;
            margin: 12px 0 6px;
        }

        :deep(h5) {
            font-size: 1rem;
            font-weight: 500;
            margin: 10px 0 4px;
        }

        :deep(h6) {
            font-size: 1rem;
            font-weight: 500;
            margin: 8px 0 4px;
        }

        :deep(pre) {
            position: relative;
            background: black;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 16px;
            overflow: auto;
            margin: 16px 0;

            .copy-code-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                padding: 2px 6px;
                font-size: 12px;
                cursor: pointer;
                border: none;
                border-radius: 4px;
                color: #fff;
                opacity: 0.7;
                transition: opacity 0.2s;

                &:hover {
                    opacity: 1;
                }
            }

            code {
                background: none;
                padding: 0;
            }
        }

        :deep(ul),
        :deep(ol) {
            margin: 16px 0;
            padding-left: 32px;
        }

        :deep(li) {
            margin-bottom: 8px;
        }

        :deep(blockquote) {
            border-left: 4px solid rgba(99, 102, 241, 0.5);
            padding-left: 20px;
            margin: 16px 0;
            color: rgba(0, 0, 0, 0.7);
            font-style: italic;
            background: rgba(99, 102, 241, 0.05);
            border-radius: 4px;
        }

        :deep(hr) {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 24px 0;
        }

        :deep(img) {
            max-width: 100%;
            display: block;
            margin: 16px 0;
            border-radius: 8px;
        }

        // 链接
        :deep(a) {
            color: #6366f1;
            text-decoration: underline;
            word-break: break-word;
        }

        :deep(table) {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }

        :deep(th),
        :deep(td) {
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            text-align: left;
        }

        :deep(th) {
            background-color: #f5f5f5;
            font-weight: 600;
        }

    }
}

.reasoning-section {
    margin-left: -1rem;
    margin-right: -1rem;
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.05), transparent);
    border-radius: 0;
    overflow: hidden;

    .reasoning-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), transparent);
        border: none;
        cursor: pointer;
        width: 100%;
        transition: all 0.2s ease;
        color: var(--color-text-primary);
        font-weight: 600;
        font-size: 0.9rem;

        &:hover {
            background: linear-gradient(90deg, rgba(99, 102, 241, 0.15), transparent);
        }

        .reasoning-icon {
            width: 1rem;
            height: 1rem;
            flex-shrink: 0;
            color: var(--color-accent);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &.expanded {
                transform: rotate(180deg);
            }
        }

        .reasoning-label {
            flex: 1;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .reasoning-length {
            font-size: 0.8rem;
            opacity: 0.7;
            font-weight: 400;
        }
    }

    .reasoning-content {
        padding: 0rem 0 0 0.2rem;
        overflow-wrap: break-word;
        word-break: break-word;
        background: rgba(99, 102, 241, 0.02);
        line-height: 1.6;
        color: var(--color-text-secondary);

        :deep(p) {
            font-size: 0.8rem;
            margin: 1rem;
        }

        .markdown-content {

            :deep(p) {
                margin: 0.4rem 0;

                &:last-child {
                    margin-bottom: 0;
                }
            }

            :deep(pre) {
                background: rgba(30, 41, 59, 0.8);
                padding: 0.75rem;
                font-size: 0.8rem;
                margin: 0.5rem 0;
                border-radius: 0.3rem;
            }

            :deep(code) {
                background: rgba(99, 102, 241, 0.1);
                padding: 0.1rem 0.3rem;
                border-radius: 0.2rem;
                font-size: 0.85rem;
            }

            :deep(blockquote) {
                border-left-color: rgba(99, 102, 241, 0.3);
                background: rgba(99, 102, 241, 0.05);
                padding: 0.5rem 0.75rem;
                margin: 0.5rem 0;
            }

            :deep(ul),
            :deep(ol) {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
            }

            :deep(li) {
                margin: 0.3rem 0;
            }
        }
    }
}

.thinking-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 1rem 0;

    .thinking-icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
    }

    .thinking-text {
        font-size: 0.95rem;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary);
        font-weight: 400;
    }
}

.message-image {
    max-width: 100%;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    position: relative;

    image {
        width: 100%;
        display: block;
    }

    .image-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent 60%, rgba(0, 0, 0, 0.3));
        pointer-events: none;
    }
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(2.5rem) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}

@keyframes successPulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.15);
    }
}

@keyframes rotate360 {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.expand-enter-active,
.expand-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.expand-enter-from {
    opacity: 0;
    max-height: 0;
}

.expand-leave-to {
    opacity: 0;
    max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
    opacity: 1;
    max-height: 500px;
}
</style>