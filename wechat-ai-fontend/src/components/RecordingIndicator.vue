<script>
import micIcon from '@/assets/mic-outline-bg.svg'
import closeIcon from '@/assets/close-circle-outline.svg'
import { h } from 'vue';

export default {
    name: 'RecordingIndicator',

    props: {
        isRecording: Boolean,
        duration: Number,
        isCancel: Boolean
    },

    emits: ['cancel'],

    methods: {
        formatDuration(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs
                .toString()
                .padStart(2, '0')}`;
        },
        handleCancel() {
            this.$emit('cancel');
        }
    },

    render() {
        return h(
            'div',
            {
                class: [
                    'recording-indicator',
                    this.isRecording ? 'active' : ''
                ]
            },
            [
                h('div', { class: 'recording-content' }, [
                    h('div', { class: 'recording-icon' }, [
                        h('img', {
                            src: micIcon,
                        })
                    ]),

                    h('div', { class: 'recording-info' }, [
                        h('div', { class: 'recording-title' }, '正在录音...'),
                        h(
                            'div',
                            { class: 'recording-duration' },
                            this.formatDuration(this.duration)
                        )
                    ]),

                    h(
                        'div',
                        {
                            class: [
                                'recording-action',
                                this.isCancel ? 'cancel' : ''
                            ],
                            onClick: this.handleCancel
                        },
                        [
                            h('img', {
                                src: closeIcon,
                            })
                        ]
                    )
                ])
            ]
        );
    }
};
</script>

<style lang="scss" scoped>
.recording-indicator {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.28s ease;
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);

    &.active {
        opacity: 1;
        pointer-events: auto;
    }

    .recording-content {
        display: flex;
        align-items: center;
        padding: 2rem 2rem;
        border-radius: 3rem;
        background: var(--color-bg-card);
        box-shadow: var(--shadow-strong);
        animation: scaleIn 0.26s ease-out;
        border: 2px solid var(--color-border-subtle);
        gap: 24px;
    }

    .recording-icon {
        width: 4rem;
        height: 4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 2rem;
        background: linear-gradient(135deg, #34d399 0%, #0ea5e9 100%);
        animation: pulse 2s infinite;
        position: relative;
        flex-shrink: 0;
        box-shadow: 0 24px 36px rgba(14, 165, 233, 0.24);

        &::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 6rem;
            height: 6rem;
            // width: 140px;
            // height: 140px;
            border-radius: 32px;
            background: rgba(14, 165, 233, 0.18);
            transform: translate(-50%, -50%);
            animation: ripple 2.2s infinite;
        }

        img {
            width: 2rem;
            height: 2rem;
            animation: bounce 1.2s infinite;
            filter: brightness(0) invert(1);
        }
    }

    .recording-info {
        flex: 1;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .recording-title {
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--color-text-primary);
        letter-spacing: 0.8px;
    }

    .recording-duration {
        font-size: 1.3rem;
        font-weight: 700;
        color: #0f766e;
        font-family: 'Courier New', monospace;
        letter-spacing: 2px;
    }

    .recording-action {
        width: 4rem;
        height: 4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 2rem;
        background: rgba(248, 113, 113, 0.12);
        transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        cursor: pointer;
        flex-shrink: 0;
        box-shadow: 0 18px 32px rgba(248, 113, 113, 0.2);

        &:active {
            transform: translateY(4px);
            box-shadow: 0 14px 20px rgba(248, 113, 113, 0.22);
        }

        img {
            width: 2rem;
            height: 2rem;
            filter: hue-rotate(-20deg);
        }
    }
}

// 动画
@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.8);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.1);
        opacity: 0.9;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes ripple {
    0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }

    100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
    }
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-5px);
    }
}
</style>