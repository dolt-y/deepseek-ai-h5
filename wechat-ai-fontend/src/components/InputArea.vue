<!-- 输入框组件 -->
<template>
    <div class="input-wrapper">
        <div class="input-toolbar">
            <div class="toolbar-right">
                <div class="capsule" @click="onNewSession">
                    <img src="../assets/add-outline.svg" alt="新建会话">
                    <span class="capsule-text">新建会话</span>
                </div>
                <div class="capsule" @click="handleImageUpload">
                    <img src="../assets/image-outline.svg" alt="插入图片">
                    <span class="capsule-text">插入图片</span>
                </div>
                <div class="capsule" @click="onViewHistory">
                    <img src="../assets/chatbubble-outline.svg" alt="历史会话">
                    <span class="capsule-text">{{ '历史会话' }}</span>
                </div>
            </div>
            <div class="toolbar-left">
                <div class="model-selector" v-if="showModelSelector">
                    <div class="model-dropdown" @click.stop="toggleModelDropdown"
                        :class="{ 'dropdown-open': isModelDropdownOpen }">
                        <span class="model-selected">{{ selectedModelText }}</span>
                        <img src="../assets/chevron-down.svg" class="chevron-icon" />
                    </div>
                    <div v-if="isModelDropdownOpen" class="model-dropdown-menu">
                        <div v-for="model in modelOptions" :key="model.value" class="model-option"
                            :class="{ 'model-option-active': model.value === selectedModel }"
                            @click="selectModel(model.value)">
                            {{ model.text }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="input-surface">
            <textarea class="textarea" v-model="inputContent" placeholder="组织好你的问题，让我为你补全灵感..."
                placeholder-style="color: rgba(47,58,102,0.35)" :disabled="isRecording" @focus="onInputFocus"
                @blur="onInputBlur" maxlength="1000"></textarea>
            <div class="input-actions">
                <div class="icon-btn" @click="toggleRecording" :class="{ active: isRecording }" title="语音输入">
                    <img src="../assets/mic-outline.svg" />
                </div>
                <div class="send-btn" v-debounce="handleSend" :class="{ disabled: !canSend }">
                    <img src="../assets/send-outline.svg"></img>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    isRecording: {
        type: Boolean,
        default: false
    },
    recordingDuration: {
        type: Number,
        default: 0
    },
    selectedModel: {
        type: String,
        default: 'deepseek-chat'
    },
    modelOptions: {
        type: Array as () => Array<{ value: string; text: string }>,
        default: () => [
            { value: "deepseek-chat", text: "DeepSeek-快速问答" },
            { value: 'deepseek-reasoner', text: "DeepSeek-深度思考" }
        ]
    },
    showModelSelector: {
        type: Boolean,
        default: true
    }
});

const inputContent = ref(props.modelValue);
const isInputFocused = ref(false);
const emit = defineEmits([
    'update:modelValue',
    'send-message',
    'upload-image',
    'toggle-voice',
    'stop-recording',
    'handle-recording-move',
    'viewHistory',
    'new-session',
    'update:selectedModel',
    'settings'
]);

watch(() => props.modelValue, (newVal) => {
    inputContent.value = newVal;
});

// 监听inputContent变化，同步到父组件
watch(inputContent, (newVal) => {
    emit('update:modelValue', newVal);
});
const onViewHistory = () => {
    emit('viewHistory');
}
const onNewSession = () => {
    emit('new-session');
}

const handleImageUpload = () => {
    if (props.isRecording) return;
}
const canSend = computed(() => inputContent.value.trim().length > 0 && !props.isRecording);

function handleSend() {
    if (!canSend.value) return;

    const content = inputContent.value.trim();
    if (content) {
        emit('send-message', content);
        inputContent.value = '';
    }
}
function toggleRecording() {
    emit('stop-recording');
}

// 输入框聚焦
function onInputFocus() {
    isInputFocused.value = true;
}

// 输入框失焦
function onInputBlur() {
    isInputFocused.value = false;
}

// 模型选择相关
const isModelDropdownOpen = ref(false);
const selectedModelText = computed(() => {
    const model = props.modelOptions.find(m => m.value === props.selectedModel);
    return model ? model.text : '快速问答';
});

function toggleModelDropdown() {
    isModelDropdownOpen.value = !isModelDropdownOpen.value;
}

function selectModel(modelValue: string) {
    emit('update:selectedModel', modelValue);
    isModelDropdownOpen.value = false;
}

const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.model-selector')) {
        isModelDropdownOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>
<style scoped lang="scss">
.input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1em 0.3rem 0;
    position: relative;
    z-index: 10;

    .model-selector {
        position: relative;

        .model-dropdown {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.35rem 0.7rem;
            border-radius: 0.5rem;
            background: var(--color-bg-soft);
            border: 1px solid var(--color-border-soft);
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-soft);

            .model-selected {
                font-size: 0.85rem;
                color: var(--color-text-primary);
                font-weight: 500;
            }

            .chevron-icon {
                width: 0.9rem;
                height: 0.9rem;
                opacity: 0.6;
                transition: transform 0.2s ease;
            }

            &:hover {
                border-color: var(--color-accent);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
            }

            &.dropdown-open {
                border-color: var(--color-accent);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);

                .chevron-icon {
                    transform: rotate(180deg);
                }
            }
        }

        .model-dropdown-menu {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.3rem;
            min-width: 10rem;
            background: var(--color-bg-card);
            border: 1px solid var(--color-border-soft);
            border-radius: 0.75rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            z-index: 1000;
            overflow: hidden;
            animation: dropdownFadeIn 0.2s ease;

            .model-option {
                padding: 0.6rem 1rem;
                font-size: 0.9rem;
                color: var(--color-text-primary);
                cursor: pointer;
                transition: all 0.15s ease;

                &:hover {
                    background: var(--color-bg-soft);
                }

                &.model-option-active {
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
                    color: var(--color-accent);
                    font-weight: 600;
                }

                &:first-child {
                    border-radius: 0.75rem 0.75rem 0 0;
                }

                &:last-child {
                    border-radius: 0 0 0.75rem 0.75rem;
                }
            }
        }
    }

    @keyframes dropdownFadeIn {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .input-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;

        .toolbar-left {
            display: flex;
            gap: 1rem;
        }

        .toolbar-right {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
    }

    .capsule {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.4rem;
        border-radius: 0.5rem;
        background: var(--color-bg-soft);
        border: 1px solid var(--color-border-soft);
        color: var(--color-text-primary);
        box-shadow: var(--shadow-soft);

        .capsule-text {
            font-size: 0.8rem;
        }

        img {
            width: 1.2rem;
            height: 1.2rem;
            opacity: 0.72;
        }

        &:active {
            transform: translateY(3px);
            box-shadow: 0 0.5rem 1.2rem rgba(93, 105, 187, 0.16);
        }
    }
}

.input-surface {
    // width: 25.5rem;
    width: 80vw;
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    padding: 1rem;
    border-radius: 1.2rem;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    box-shadow: var(--shadow-soft);

    backdrop-filter: blur(var(--blur-card));
    -webkit-backdrop-filter: blur(var(--blur-card));

    .textarea {
        flex: 1;
        min-height: 6rem;
        // padding-right: 0.5rem;
        border: none;
        background: transparent;
        font-size: 1rem;
        color: var(--color-text-primary);
        line-height: 1.6;
        -webkit-appearance: none;
        appearance: none;
        outline: none;
        resize: none;
    }

    .input-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        position: relative;

        .voice-recording-wrapper {
            position: absolute;
            bottom: 100%;
            left: 0;
            margin-bottom: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--color-bg-card);
            border: 1px solid var(--color-border-soft);
            border-radius: 0.75rem;
            box-shadow: var(--shadow-strong);
            backdrop-filter: blur(var(--blur-card));
            -webkit-backdrop-filter: blur(var(--blur-card));

            .recording-indicator {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                .recording-dot {
                    width: 0.5rem;
                    height: 0.5rem;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    animation: recordingPulse 1.5s ease-in-out infinite;
                }

                .recording-text {
                    font-size: 0.85rem;
                    color: var(--color-text-primary);
                    font-weight: 500;
                }
            }
        }

        @keyframes recordingPulse {

            0%,
            100% {
                opacity: 1;
                transform: scale(1);
            }

            50% {
                opacity: 0.5;
                transform: scale(0.8);
            }
        }
    }

    .icon-btn {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-bg-soft);
        border: 1px solid var(--color-border-soft);
        box-shadow: var(--shadow-soft);
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        img {
            width: 1.2rem;
            height: 1.2rem;
            opacity: 0.72;
        }

        &:active {
            transform: translateY(3px);
            box-shadow: 0 10px 18px rgba(93, 105, 187, 0.2);
        }

        &.active {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-color: rgba(239, 68, 68, 0.4);
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
            animation: recordingButtonPulse 1.5s ease-in-out infinite;

            img {
                filter: brightness(0) invert(1);
                opacity: 1;
            }
        }

        @keyframes recordingButtonPulse {

            0%,
            100% {
                box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
            }

            50% {
                box-shadow: 0 8px 30px rgba(239, 68, 68, 0.5);
            }
        }
    }

    .send-btn {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
        box-shadow: 0 18px 30px rgba(99, 102, 241, 0.28);
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        img {
            width: 1.2rem;
            height: 1.2rem;
            filter: brightness(0) invert(1);
        }

        &.disabled {
            background: rgba(226, 232, 240, 0.9);
            box-shadow: none;
            opacity: 0.45;
            pointer-events: none;
        }

        &:active {
            transform: translateY(3px);
            box-shadow: 0 12px 18px rgba(99, 102, 241, 0.32);
        }
    }
}
</style>
