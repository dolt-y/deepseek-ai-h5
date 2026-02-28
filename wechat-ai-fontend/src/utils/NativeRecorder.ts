import { ElMessage } from 'element-plus';

/**
 * NativeRecorder 使用 MediaRecorder 优先录音，不支持时回退到 ScriptProcessor。
 * 无论录制方式，最终都返回符合后端需求的 WAV Blob。
 */
class NativeRecorder {
  private readonly targetSampleRate = 16000;

  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private pcmData: Float32Array[] = [];

  private mediaRecorder: MediaRecorder | null = null;
  private mediaChunks: Blob[] = [];
  private mediaMimeType: string | undefined;
  private usingMediaRecorder = false;

  async start(): Promise<void> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasMic = devices.some(d => d.kind === "audioinput");

    if (!hasMic) {
      ElMessage.error("未检测到可用的麦克风设备");
      throw new Error("未检测到可用的麦克风设备");
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      ElMessage.error("无法访问麦克风，请检查权限");
      console.error("getUserMedia 错误:", err);
      throw err;
    }

    if (this.setupMediaRecorder()) {
      console.log("录音开始 (MediaRecorder)");
      return;
    }

    // Fallback: Web Audio + ScriptProcessor
    this.audioContext = new AudioContext({ sampleRate: this.targetSampleRate });
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor?.(4096, 1, 1) || null;

    if (!this.processor) {
      ElMessage.error("当前浏览器不支持音频处理节点");
      throw new Error("ScriptProcessorNode 不支持");
    }

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      this.pcmData.push(new Float32Array(input));
    };

    console.log("录音开始 (ScriptProcessor)");
  }

  async stop(): Promise<Blob> {
    if (this.usingMediaRecorder && this.mediaRecorder) {
      return this.stopMediaRecorder();
    }

    return new Promise((resolve) => {
      this.stopStream();

      try {
        this.processor?.disconnect();
        this.source?.disconnect();
        this.audioContext?.close();
      } catch (e) {
        console.warn("音频节点释放失败", e);
      }

      this.processor = null;
      this.source = null;
      this.audioContext = null;

      const pcm = this.mergePCM(this.pcmData);
      const wavBlob = this.encodeWAV(pcm);
      this.pcmData = [];

      resolve(wavBlob);
    });
  }

  private setupMediaRecorder(): boolean {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return false;
    }

    if (!this.stream) {
      return false;
    }

    const mimeType = this.getSupportedMimeType();
    try {
      const options: MediaRecorderOptions = {
        audioBitsPerSecond: this.targetSampleRate * 16,
      };
      if (mimeType) {
        options.mimeType = mimeType;
      }

      this.mediaMimeType = mimeType;
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    } catch (error) {
      console.warn("初始化 MediaRecorder 失败:", error);
      this.mediaRecorder = null;
      return false;
    }

    this.mediaChunks = [];
    this.usingMediaRecorder = true;

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.mediaChunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error("MediaRecorder 错误:", event);
      ElMessage.error("录音过程中发生错误");
    };

    this.mediaRecorder.start();
    return true;
  }

  private stopMediaRecorder(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        resolve(new Blob([], { type: "audio/wav" }));
        return;
      }

      const recorder = this.mediaRecorder;
      recorder.onstop = async () => {
        try {
          this.stopStream();
          const recordedBlob = new Blob(this.mediaChunks, {
            type: this.mediaMimeType || recorder.mimeType || "audio/wav",
          });
          this.resetMediaRecorder();
          const wavBlob = await this.ensureWav(recordedBlob);
          resolve(wavBlob);
        } catch (error) {
          this.resetMediaRecorder();
          reject(error);
        }
      };

      try {
        recorder.stop();
      } catch (error) {
        console.error("停止 MediaRecorder 失败:", error);
        this.resetMediaRecorder();
        reject(error);
      }
    });
  }

  private stopStream() {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  private resetMediaRecorder() {
    this.mediaRecorder = null;
    this.mediaChunks = [];
    this.mediaMimeType = undefined;
    this.usingMediaRecorder = false;
  }

  private getSupportedMimeType(): string | undefined {
    if (typeof MediaRecorder === "undefined") {
      return undefined;
    }

    const preferred = [
      "audio/wav;codecs=MS_PCM",
      "audio/wav;codecs=PCM",
      "audio/wav",
    ];

    const fallbacks = [
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "",
    ];

    const candidates = [...preferred, ...fallbacks];
    const match = candidates.find(type => {
      if (!type) return true;
      return MediaRecorder.isTypeSupported(type);
    });

    return match || undefined;
  }

  private mergePCM(chunks: Float32Array[]): Float32Array {
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Float32Array(total);
    let offset = 0;

    chunks.forEach(c => {
      result.set(c, offset);
      offset += c.length;
    });

    return result;
  }

  private async ensureWav(blob: Blob): Promise<Blob> {
    if (blob.type.includes("wav")) {
      return blob;
    }

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const offlineContext = new AudioContext();
      const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
      const float32 = this.extractChannel(audioBuffer);
      await offlineContext.close();
      return this.encodeWAV(float32);
    } catch (error) {
      console.error("音频格式转换失败:", error);
      ElMessage.error("音频格式转换失败");
      throw error;
    }
  }

  private extractChannel(buffer: AudioBuffer): Float32Array {
    const channelData = buffer.getChannelData(0);
    const copied = new Float32Array(channelData);
    if (buffer.sampleRate === this.targetSampleRate) {
      return copied;
    }
    return this.downsampleBuffer(copied, buffer.sampleRate, this.targetSampleRate);
  }

  private downsampleBuffer(
    buffer: Float32Array,
    sampleRate: number,
    targetRate: number
  ): Float32Array {
    if (targetRate >= sampleRate) {
      return buffer;
    }

    const ratio = sampleRate / targetRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;

      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }

      result[offsetResult] = accum / (count || 1);
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }

    return result;
  }

  private encodeWAV(pcmData: Float32Array): Blob {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, this.targetSampleRate, true);
    view.setUint32(28, this.targetSampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, pcmData.length * 2, true);

    let offset = 44;
    for (let i = 0; i < pcmData.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, pcmData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([buffer], { type: "audio/wav" });
  }
}

export default new NativeRecorder();
