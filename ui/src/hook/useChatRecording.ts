// src/hooks/chat/useChatRecording.ts
import { ref } from 'vue';
import NativeRecorder from '@/utils/NativeRecorder';
import { get, post } from '@/utils/request';
import api from '@/utils/api';

type RecordingOptions = {
  onRecognized?: (text: string) => void;
};

type SpeechJobCreateResponse = {
  jobId: string | number;
};

type SpeechJobQueryResponse = {
  job: {
    state: string;
    text?: string;
    failedReason?: string;
  };
};

const SPEECH_JOB_MAX_ATTEMPTS = 60;
const SPEECH_JOB_POLL_INTERVAL = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useChatRecording(options: RecordingOptions = {}) {
  const isRecording = ref(false);
  const recordingDuration = ref(0);
  const isTranscribing = ref(false);

  let recordingTimer: number | null = null;

  async function handleStartRecording() {
    if (isRecording.value) return;

    isRecording.value = true;
    recordingDuration.value = 0;

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
  async function handleStopRecording() {
    if (!isRecording.value) return;

    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }

    isRecording.value = false;
    recordingDuration.value = 0;

    const wavBlob = await NativeRecorder.stop();

    try {
      isTranscribing.value = true;
      const text = await uploadSpeech(wavBlob);
      if (text) {
        options.onRecognized?.(text);
      }
      return text;
    } catch (error) {
      console.error('语音识别失败:', error);
      return '';
    } finally {
      isTranscribing.value = false;
    }
  }

  /**
   * 上传录音到 Whisper 异步转文字接口
   */
  async function uploadSpeech(wavBlob: Blob | any): Promise<string> {
    const formData = new FormData();

    formData.append('audio', wavBlob, 'audio.wav');
    const result = await post<SpeechJobCreateResponse>(api.recording, formData);

    for (let i = 0; i < SPEECH_JOB_MAX_ATTEMPTS; i++) {
      const status = await get<SpeechJobQueryResponse>(api.recordingJob(result.jobId));

      if (status.job.state === 'completed') {
        return status.job.text || '';
      }

      if (status.job.state === 'failed') {
        throw new Error(status.job.failedReason || '语音识别任务失败');
      }

      await sleep(SPEECH_JOB_POLL_INTERVAL);
    }

    throw new Error('语音识别任务超时');
  }

  return {
    isRecording,
    recordingDuration,
    isTranscribing,
    handleStartRecording,
    handleStopRecording,
  };
}
