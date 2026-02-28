// directives/rate.ts
import type { App, Directive } from 'vue';

interface DebounceElement extends HTMLElement {
    _debounceHandler?: () => void;
}

interface ThrottleElement extends HTMLElement {
    _throttleHandler?: () => void;
}

export default function (app: App) {
    const directives = {
        // 防抖
        debounce: {
            mounted(el: DebounceElement, binding) {
                const delay = binding.arg ? Number(binding.arg) : 300;
                let timer: number;

                const handler = binding.value;
                if (typeof handler !== 'function') {
                    console.warn('v-debounce 绑定值必须是函数');
                    return;
                }

                el._debounceHandler = () => {
                    clearTimeout(timer);
                    timer = window.setTimeout(() => {
                        handler();
                    }, delay);
                };

                el.addEventListener('click', el._debounceHandler);
            },
            unmounted(el: DebounceElement) {
                if (el._debounceHandler) {
                    el.removeEventListener('click', el._debounceHandler);
                }
            },
        } as Directive,

        // 节流
        throttle: {
            mounted(el: ThrottleElement, binding) {
                const interval = binding.arg ? Number(binding.arg) : 300;
                let lastTime = 0;

                const handler = binding.value;
                if (typeof handler !== 'function') {
                    console.warn('v-throttle 绑定值必须是函数');
                    return;
                }

                el._throttleHandler = () => {
                    const now = Date.now();
                    if (now - lastTime >= interval) {
                        handler();
                        lastTime = now;
                    }
                };

                el.addEventListener('click', el._throttleHandler);
            },
            unmounted(el: ThrottleElement) {
                if (el._throttleHandler) {
                    el.removeEventListener('click', el._throttleHandler);
                }
            },
        } as Directive,
    };
    Object.entries(directives).forEach(([key, directive]) => {
        app.directive(key, directive);
    });
}

