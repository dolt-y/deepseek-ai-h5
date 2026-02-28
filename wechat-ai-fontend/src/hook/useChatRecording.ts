// src/hooks/chat/useChatRecording.ts
import { ref } from "vue";
import NativeRecorder from "@/utils/NativeRecorder";
import { post } from '@/utils/request';
import api from "@/utils/api";

type RecordingOptions = {
    onRecognized?: (text: string) => void;
};

export function useChatRecording(options: RecordingOptions = {}) {
    const isRecording = ref(false);
    const recordingDuration = ref(0);
    const isCancel = ref(false);

    let recordingTimer: number | null = null;

    async function handleStartRecording() {
        if (isRecording.value) return;

        isRecording.value = true;
        recordingDuration.value = 0;
        isCancel.value = false;

        recordingTimer = setInterval(() => {
            recordingDuration.value += 1;
        }, 1000);

        try {
            await NativeRecorder.start();
        } catch (error) {
            if (recordingTimer) {
                clearInterval(recordingTimer);
                recordingTimer = null;
            }
            isRecording.value = false;
            recordingDuration.value = 0;
            return;
        }
    }

    /**
     * 停止录音 -> 上传后端 -> 返回识别文本
     */
    async function stopRecording() {
        if (!isRecording.value) return;

        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }

        isRecording.value = false;
        recordingDuration.value = 0;

        // 获取录音文件（Blob）
        const wavBlob = await NativeRecorder.stop();
        console.log("wavBlob:", wavBlob);

        // 如果被取消，不上传
        // if (isCancel.value) return "";

        // 上传到后端 Whisper API
        const text = await uploadSpeech(wavBlob);
        console.log("识别文本:", text);
        if (text) {
            options.onRecognized?.(text);
        }
        return text;
    }

    function handleStopRecording() {
        isCancel.value = true;
        stopRecording();
    }

    /**
     * 上传录音到 Whisper 转文字接口
     */
    async function uploadSpeech(wavBlob: Blob | any): Promise<string> {
        const formData = new FormData();

        formData.append("audio", wavBlob, "audio.wav");
        const result = await post<any>(api.recording, formData);
        console.log(result.text);

        return result.text || "";
    }

    return {
        isRecording,
        recordingDuration,
        isCancel,
        handleStartRecording,
        handleStopRecording,
        stopRecording,
    };
}
