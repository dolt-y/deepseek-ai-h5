import { nextTick } from "vue";
export type ScrollToBottomFn = (targetId?: string) => Promise<void>;
export function useChatScroll(): { scrollToBottom: ScrollToBottomFn; bottomAnchorId: string } {
    const bottomAnchorId = "chat-bottom-anchor";

    async function scrollToBottom() {
        await nextTick();

        const chatBody = document.querySelector(".chat-body") as HTMLElement;
        if (!chatBody) return;

        const distance = chatBody.scrollHeight - (chatBody.scrollTop + chatBody.clientHeight);

        if (distance < 30) {

            chatBody.scrollTop += distance * 0.5;
        } else {
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

    return {
        scrollToBottom,
        bottomAnchorId,
    };
}
