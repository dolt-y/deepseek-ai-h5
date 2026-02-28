<template>
    <div v-if="visible" :class="['overlay', { 'overlay-active': visible }]" @click="handleClose">
        <div :class="['drawer', { 'drawer-open': visible }]" @click.stop>
            <div class="drawer-handle">
                <div class="handle-bar"></div>
            </div>

            <div class="drawer-header">
                <h2 class="header-title">历史会话</h2>
                <p class="header-subtitle">共 {{ sessions.length }} 条对话</p>
            </div>

            <div class="drawer-body">
                <div v-if="loading" class="state-empty">
                    <div class="spinner"></div>
                    <p>加载中...</p>
                </div>

                <div v-else-if="errorMessage" class="state-empty">
                    <p class="error-text">{{ errorMessage }}</p>
                    <button class="retry-btn" @click.stop="refreshSessions">重试</button>
                </div>

                <div v-else-if="!sessions.length" class="state-empty">
                    <p class="empty-text">暂无历史会话</p>
                    <p class="empty-hint">开始新的对话吧</p>
                </div>

                <div v-else class="session-list">
                    <div v-for="session in sessions" :key="session.id"
                        :class="['session-card', { 'session-active': session.id === props.activeSessionId }]"
                        @click="selectSession(session)">
                        <div class="session-content">
                            <h3 class="session-title">{{ session.title || '未命名会话' }}</h3>
                            <p class="session-desc">{{ session.summary || '暂无摘要' }}</p>
                            <span class="session-time">{{ formatTimeText(session.updated_at) }}</span>
                        </div>
                        <button class="session-delete" @click.stop="confirmDelete(session)"
                            :disabled="deletingId === session.id">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path
                                    d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showDeleteConfirm" class="confirm-overlay" @click="cancelDelete">
                <div class="confirm-card" @click.stop>
                    <h3 class="confirm-title">删除会话</h3>
                    <p class="confirm-message">确定要删除"{{ deleteTarget?.title || '未命名会话' }}"吗？</p>
                    <p class="confirm-warning">此操作无法撤销</p>
                    <div class="confirm-buttons">
                        <button class="btn btn-secondary" @click="cancelDelete">取消</button>
                        <button class="btn btn-danger" @click="deleteSession">
                            {{ deletingId ? '删除中...' : '删除' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { get, post } from '@/utils/request';
import api from '@/utils/api';
import { formatTimeText } from '@/utils/tools';
type SessionItem = {
    id: number | string;
    title?: string;
    summary?: string;
    updated_at?: string;
};
const props = defineProps<{
    visible: boolean;
    activeSessionId?: number | string | null;
}>();
const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'select-session', session: SessionItem): void;
    (e: 'delete-session', sessionId: number | string): void;
}>();
const sessions = ref<SessionItem[]>([]);
const loading = ref(false);
const errorMessage = ref('');

const showDeleteConfirm = ref(false);
const deleteTarget = ref<SessionItem | null>(null);
const deletingId = ref<number | string | null>(null);

function confirmDelete(session: SessionItem) {
    deleteTarget.value = session;
    showDeleteConfirm.value = true;
}

function cancelDelete() {
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
}

function handleClose() {
    emit('close');
}

function selectSession(session: SessionItem) {
    emit('select-session', session);
    handleClose();
}

async function fetchSessions() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const res: any = await get(api.getSessionList);
        sessions.value = res?.sessions ?? [];
    } catch (err) {
        console.error('获取会话失败', err);
        errorMessage.value = '获取会话失败';
    } finally {
        loading.value = false;
    }
}
async function deleteSession() {
    if (!deleteTarget.value || deletingId.value) return;

    const sessionId = deleteTarget.value.id;
    deletingId.value = sessionId;

    try {
        await post(api.deleteSession(sessionId));
        sessions.value = sessions.value.filter(s => s.id !== sessionId);
        emit('delete-session', sessionId);
    } catch (err) {
        console.error('删除会话失败', err);
    } finally {
        deletingId.value = null;
        showDeleteConfirm.value = false;
        deleteTarget.value = null;
    }
}
function refreshSessions() {
    if (loading.value) return;
    fetchSessions();
}

watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            fetchSessions();
        }
    }
);

onMounted(() => {
    if (props.visible) {
        fetchSessions();
    }
});
</script>

<style lang="scss" scoped>
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(0.417rem);
    display: flex;
    align-items: flex-end;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
}

.overlay-active {
    opacity: 1;
    pointer-events: auto;
}

.drawer {
    width: 100%;
    max-height: 75vh;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -0.167rem 2rem rgba(0, 0, 0, 0.15);
    border-radius: 1.25rem 1.25rem 0 0;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    overflow: hidden;
}

.drawer-open {
    transform: translateY(0);
}

.drawer-handle {
    padding: 0.75rem 0 0.5rem;
    display: flex;
    justify-content: center;
}

.handle-bar {
    width: 3rem;
    height: 0.333rem;
    background: #E5E7EB;
    border-radius: 999rem;
}

.drawer-header {
    padding: 0.75rem 1.5rem 1.5rem;
    border-bottom: 1px solid #F3F4F6;
}

.header-title {
    font-size: 1.667rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.333rem;
    line-height: 1.2;
}

.header-subtitle {
    font-size: 1.083rem;
    color: #6B7280;
    margin: 0;
    font-weight: 500;
}

.drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem 1.5rem;
}

.state-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
    gap: 0.75rem;

    p {
        margin: 0;
        font-size: 1.167rem;
        color: #6B7280;
    }

    .empty-text {
        font-size: 1.25rem;
        color: #374151;
        font-weight: 600;
    }

    .empty-hint {
        font-size: 1.083rem;
        color: #9CA3AF;
    }

    .error-text {
        color: #EF4444;
        font-weight: 500;
    }
}

.spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #E5E7EB;
    border-top-color: #6366F1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.retry-btn {
    padding: 0.667rem 1.5rem;
    background: #6366F1;
    color: #FFFFFF;
    border: none;
    border-radius: 0.5rem;
    font-size: 1.083rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.95);
        background: #4F46E5;
    }
}

.session-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.session-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 0.75rem;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
        border-color: #D1D5DB;
    }

    &:active {
        transform: scale(0.98);
    }

    &.session-active {
        background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
        border-color: #6366F1;
        box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.1);
    }
}

.session-content {
    flex: 1;
    min-width: 0;
}

.session-title {
    font-size: 1.167rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.333rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
}

.session-desc {
    font-size: 1rem;
    color: #6B7280;
    margin: 0 0 0.5rem;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.session-time {
    font-size: 0.917rem;
    color: #9CA3AF;
    font-weight: 500;
}

.session-delete {
    flex-shrink: 0;
    width: 2.333rem;
    height: 2.333rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    color: #9CA3AF;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #FEE2E2;
        color: #EF4444;
    }

    &:active {
        transform: scale(0.9);
    }

    &:disabled {
        opacity: 0.5;
        pointer-events: none;
    }
}

.confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(0.333rem);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1.5rem;
    animation: fadeIn 0.2s ease;
}

.confirm-card {
    width: 100%;
    max-width: 21rem;
    background: #FFFFFF;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1.25rem 3rem rgba(0, 0, 0, 0.2);
    animation: scaleIn 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.confirm-title {
    font-size: 1.417rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.75rem;
}

.confirm-message {
    font-size: 1.083rem;
    color: #374151;
    margin: 0 0 0.417rem;
    line-height: 1.5;
}

.confirm-warning {
    font-size: 1rem;
    color: #9CA3AF;
    margin: 0 0 1.5rem;
}

.confirm-buttons {
    display: flex;
    gap: 0.75rem;
}

.btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1.083rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.95);
    }
}

.btn-secondary {
    background: #F3F4F6;
    color: #374151;

    &:active {
        background: #E5E7EB;
    }
}

.btn-danger {
    background: #EF4444;
    color: #FFFFFF;

    &:active {
        background: #DC2626;
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes scaleIn {
    from {
        transform: scale(0.95);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
