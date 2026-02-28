<template>
    <div v-if="visible" :class="['overlay', { 'overlay-active': visible }]" @click="handleClose">
        <div :class="['drawer', { 'drawer-open': visible }]" @click.stop>
            <div class="drawer-handle">
                <div class="handle-bar"></div>
            </div>

            <div class="drawer-header">
                <div class="header-icon-wrapper">
                    <img src="@/assets/settings-icon.svg" alt="设置" class="header-icon" />
                </div>
                <h2 class="header-title">设置</h2>
                <p class="header-subtitle">个性化你的聊天体验</p>
            </div>

            <div class="drawer-body">
                <!-- 对话设置 -->
                <div class="settings-section">
                    <h3 class="section-title">
                        <img src="@/assets/chatbubble-outline.svg" alt="对话" class="section-icon" />
                        对话设置
                    </h3>
                    <div class="setting-item">
                        <div class="setting-label-wrapper">
                            <span class="setting-label">默认模型</span>
                            <span class="setting-desc">选择默认使用的 AI 模型</span>
                        </div>
                        <select v-model="defaultModel" class="setting-select">
                            <option value="deepseek-chat">快速问答</option>
                            <option value="deepseek-reasoner">深度思考</option>
                        </select>
                    </div>
                    <div class="setting-item toggle-item">
                        <div class="setting-label-wrapper">
                            <span class="setting-label">自动滚动</span>
                            <span class="setting-desc">新消息时自动滚动到底部</span>
                        </div>
                        <label class="toggle-switch">
                            <input v-model="autoScroll" type="checkbox" />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- 显示设置 -->
                <div class="settings-section">
                    <h3 class="section-title">
                        <img src="@/assets/image-outline.svg" alt="显示" class="section-icon" />
                        显示设置
                    </h3>
                    <div class="setting-item toggle-item">
                        <div class="setting-label-wrapper">
                            <span class="setting-label">深色模式</span>
                            <span class="setting-desc">切换到深色主题</span>
                        </div>
                        <label class="toggle-switch">
                            <input v-model="darkMode" type="checkbox" />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-item toggle-item">
                        <div class="setting-label-wrapper">
                            <span class="setting-label">显示代码行号</span>
                            <span class="setting-desc">代码块中显示行号</span>
                        </div>
                        <label class="toggle-switch">
                            <input v-model="showLineNumbers" type="checkbox" />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- 高级设置 -->
                <div class="settings-section">
                    <h3 class="section-title">
                        <img src="@/assets/add-outline.svg" alt="高级" class="section-icon" />
                        高级设置
                    </h3>
                    <div class="setting-item">
                        <div class="setting-label-wrapper">
                            <span class="setting-label">API 端点</span>
                            <span class="setting-desc">自定义 API 服务器地址</span>
                        </div>
                        <input v-model="apiEndpoint" type="text" class="setting-input" placeholder="API 服务器地址" />
                    </div>
                    <div class="setting-item toggle-item">
                        <div class="setting-label-wrapper">
                            <span class="setting-label">开发者模式</span>
                            <span class="setting-desc">显示调试信息</span>
                        </div>
                        <label class="toggle-switch">
                            <input v-model="developerMode" type="checkbox" />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="drawer-footer">
                <button class="btn btn-secondary" @click="resetSettings">
                    恢复默认
                </button>
                <button class="btn btn-primary" @click="saveSettings">
                    保存设置
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'update-settings', settings: any): void;
}>();

const defaultModel = ref('deepseek-chat');
const darkMode = ref(false);
const showLineNumbers = ref(true);
const autoScroll = ref(true);
const apiEndpoint = ref('');
const developerMode = ref(false);

const handleClose = () => {
    emit('close');
};

const saveSettings = () => {
    const settings = {
        defaultModel: defaultModel.value,
        darkMode: darkMode.value,
        showLineNumbers: showLineNumbers.value,
        autoScroll: autoScroll.value,
        apiEndpoint: apiEndpoint.value,
        developerMode: developerMode.value,
    };

    // 保存到本地存储
    localStorage.setItem('appSettings', JSON.stringify(settings));

    // 发送更新事件
    emit('update-settings', settings);

    // 显示保存成功提示
    ElMessage.success('设置已保存');
    handleClose();
};

const loadSettings = () => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        defaultModel.value = settings.defaultModel || 'deepseek-chat';
        darkMode.value = settings.darkMode || false;
        showLineNumbers.value = settings.showLineNumbers !== undefined ? settings.showLineNumbers : true;
        autoScroll.value = settings.autoScroll !== undefined ? settings.autoScroll : true;
        apiEndpoint.value = settings.apiEndpoint || '';
        developerMode.value = settings.developerMode || false;
    }
};

const resetSettings = () => {
    defaultModel.value = 'deepseek-chat';
    darkMode.value = false;
    showLineNumbers.value = true;
    autoScroll.value = true;
    apiEndpoint.value = '';
    developerMode.value = false;
    
    // 清除本地存储
    localStorage.removeItem('appSettings');
    
    // 发送更新事件
    emit('update-settings', {
        defaultModel: defaultModel.value,
        darkMode: darkMode.value,
        showLineNumbers: showLineNumbers.value,
        autoScroll: autoScroll.value,
        apiEndpoint: apiEndpoint.value,
        developerMode: developerMode.value,
    });
    
    ElMessage.success('设置已重置为默认值');
};

watch(() => props.visible, (visible) => {
    if (visible) {
        loadSettings();
    }
});

onMounted(() => {
    if (props.visible) {
        loadSettings();
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
    max-height: 85vh;
    background: var(--color-bg-card, #FFFFFF);
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
    padding: 1rem 1.5rem 1.25rem;
    border-bottom: 1px solid #F3F4F6;
    text-align: center;
}

.header-icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background: linear-gradient(135deg, #6366F1 0%, #8b5cf6 100%);
    border-radius: 50%;
    margin-bottom: 0.75rem;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.header-icon {
    width: 1.5rem;
    height: 1.5rem;
    filter: brightness(0) invert(1);
}

.header-title {
    font-size: 1.667rem;
    font-weight: 700;
    color: var(--color-text-primary, #111827);
    margin: 0 0 0.333rem;
    line-height: 1.2;
}

.header-subtitle {
    font-size: 1rem;
    color: var(--color-text-secondary, #6B7280);
    margin: 0;
    font-weight: 400;
}

.drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 1.5rem;
    
    &::-webkit-scrollbar {
        width: 0.5rem;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.3));
        border-radius: 0.25rem;
        transition: all 0.2s ease;

        &:hover {
            background: linear-gradient(180deg, rgba(99, 102, 241, 0.6), rgba(139, 92, 246, 0.5));
        }
    }
}

.settings-section {
    margin-bottom: 2rem;

    &:last-child {
        margin-bottom: 0;
    }
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
    font-size: 1.083rem;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
}

.section-icon {
    width: 1.2rem;
    height: 1.2rem;
    opacity: 0.8;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--color-bg-soft, #F9FAFB);
    border: 1px solid var(--color-border-soft, #E5E7EB);
    border-radius: 0.75rem;
    margin-bottom: 0.75rem;
    transition: all 0.2s ease;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        background: var(--color-bg-elevated, #FFFFFF);
        border-color: var(--color-accent, #6366F1);
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
    }

    &.toggle-item {
        justify-content: space-between;
    }
}

.setting-label-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.setting-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
}

.setting-desc {
    font-size: 0.833rem;
    color: var(--color-text-secondary, #6B7280);
    font-weight: 400;
}

.setting-input,
.setting-select {
    flex: 1;
    max-width: 12rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-soft, #E5E7EB);
    border-radius: 0.5rem;
    background: #FFFFFF;
    color: var(--color-text-primary, #111827);
    font-size: 0.917rem;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: var(--color-accent, #6366F1);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    &::placeholder {
        color: var(--color-text-secondary, #6B7280);
    }
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 3.5rem;
    height: 2rem;
    cursor: pointer;
    flex-shrink: 0;

    input {
        display: none;

        &:checked+.toggle-slider {
            background: linear-gradient(135deg, #6366F1 0%, #8b5cf6 100%);
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

            &::before {
                transform: translateX(1.5rem);
            }
        }
    }

    .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #D1D5DB;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 1rem;

        &::before {
            position: absolute;
            content: '';
            height: 1.5rem;
            width: 1.5rem;
            left: 0.25rem;
            bottom: 0.25rem;
            background-color: #FFFFFF;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
    }
}

.drawer-footer {
    padding: 1.25rem 1.5rem 1.5rem;
    border-top: 1px solid #F3F4F6;
    display: flex;
    gap: 0.75rem;
    background: var(--color-bg-soft, #F9FAFB);
}

.btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
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

.btn-primary {
    background: linear-gradient(135deg, #6366F1 0%, #8b5cf6 100%);
    color: #FFFFFF;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);

    &:active {
        background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
    }
}
</style>
