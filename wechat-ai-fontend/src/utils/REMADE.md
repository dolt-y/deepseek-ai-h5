# NativeRecorder 录音模块设计与流程总结

## 一、模块目标

NativeRecorder 的核心目标是：在浏览器能力差异较大的情况下，稳定地产出一个可直接用于后端语音识别（如 Whisper）的标准 WAV 音频文件。  
最终输出统一为 WAV（PCM / 16bit / 单声道 / 16kHz），前端完成所有不确定性处理，后端只负责识别。

---

## 二、整体设计思路

### 1. 能力检测 + 自动降级

采用渐进增强策略：
优先使用 MediaRecorder 录音；
当浏览器不支持或初始化失败时，回退到 Web Audio API + ScriptProcessor。
避免依赖单一技术方案，保证可用性。

### 2. 输出结果强约束

无论采用哪种录音路径，最终输出结果都必须是标准 WAV 音频，这是整个模块的核心不变量。

---

## 三、整体流程概览

start()：

1. 检测是否存在麦克风设备  
2. 通过 getUserMedia 获取 MediaStream  
3. 尝试初始化 MediaRecorder  
4. 若成功则进入 MediaRecorder 录音流程  
5. 若失败则回退 ScriptProcessor，实时采集 PCM 数据  

stop()：

- MediaRecorder 路径：停止录音 → 合并音频片段 → ensureWav → WAV  
- ScriptProcessor 路径：合并 PCM 数据 → encodeWAV → WAV  

---

## 四、MediaRecorder 录音路径（首选）

使用原因：
- 浏览器原生实现，性能和稳定性最好
- 实现简单，功耗和 CPU 占用低

数据流：
MediaStream → MediaRecorder → 浏览器编码 → Blob 分片

MIME 类型策略：

- 优先尝试 audio/wav
- 回退 audio/webm / audio/ogg
- 不假设浏览器输出一定符合后端要求

停止录音后，需要对结果进行格式兜底处理。

---

## 五、ScriptProcessor 录音路径（兜底）

使用场景：

- 浏览器不支持 MediaRecorder
- MediaRecorder 初始化失败
- 特定 WebView 或老旧环境

数据流：
MediaStream → AudioContext（16kHz） → ScriptProcessor → onaudioprocess → Float32 PCM

特点：

- 数据完全可控
- 格式确定
- CPU 占用相对较高，但稳定可靠

---

## 六、音频标准化处理（ensureWav）

ensureWav 的职责是保证最终输出一定是 WAV：

- 若录音结果已是 WAV，直接返回
- 若是 webm / ogg：
  - 使用 decodeAudioData 解码
  - 提取单声道音频
  - 重采样至 16kHz
  - 重新编码为 WAV

这是前端完成音频标准化、提升 Whisper 成功率的关键步骤。

---

## 七、WAV 编码（encodeWAV）

encodeWAV 手动构建 WAV 文件结构，明确指定：

- RIFF / WAVE 格式
- PCM 编码（AudioFormat = 1）
- 单声道
- 16bit 位深
- 16kHz 采样率

最终生成 Blob(type: "audio/wav")，后端可直接使用。

---

## 八、为什么在前端完成音频标准化

前端处理的优势：

- 消除浏览器输出格式的不确定性
- 降低后端复杂度
- 避免服务端依赖 ffmpeg 带来的性能与部署成本
- 提高 Whisper / ASR 识别成功率
- 减少整体请求链路延迟

---

## 九、设计要点总结

1. 能力检测优先，而不是技术偏好  
2. 自动降级，保证在各种环境下可用  
3. 前端完成音频格式统一与标准化  
4. 输出结果强约束，后端输入稳定  
5. 专门面向语音识别场景设计  

---

## 十、一句话总结

NativeRecorder 本质上是一个“浏览器差异与音频格式屏蔽层”，通过能力检测、自动降级和前端音频标准化，保证后端始终接收到稳定、可识别的 16kHz WAV 音频。

# 浏览器音频处理拓展总结

## 一、主要音频处理方式（前端常用）

| 类型 | 典型 API | 特点 | 使用场景 |
|------|----------|------|----------|
| **MediaRecorder** | MediaRecorder | 浏览器原生录音，输出 Blob，支持多种 MIME | 普通录音、语音上传、兼容现代浏览器 |
| **ScriptProcessor / AudioWorklet** | Web Audio API | 低级音频流处理，获取 PCM，可做滤波、降噪、重采样 | 高精度音频处理、实时分析、标准化 WAV 输出 |
| **getUserMedia + AudioContext** | MediaStream → AudioContext | 可获取原始流，灵活连接节点 | 实时可视化、音频特效、声学分析 |
| **Web Audio AnalyserNode** | AnalyserNode | FFT 分析、音量检测、频谱分析 | 可视化音频波形、音量计、实时音频反馈 |
| **Web Audio GainNode / BiquadFilterNode / DynamicsCompressorNode** | Web Audio API | 对音频流做增益、滤波、压缩处理 | 音频预处理、去噪、增益控制 |
| **AudioWorklet** | AudioWorkletNode | ScriptProcessor 替代方案，低延迟、更高性能 | 高性能实时音频处理、专业录音应用 |
| **Web Speech API** | SpeechRecognition | 浏览器自带语音识别 | 简单语音输入、命令识别（非文件） |

---

## 二、音频流类型及注意点

- **PCM Float32**：ScriptProcessor / AudioWorklet 获取，可做任意处理
- **压缩编码格式**：
  - Opus（webm / ogg）
  - PCM WAV（部分浏览器支持）
- **采样率差异**：
  - 默认 44.1kHz / 48kHz
  - ASR 常需 16kHz → 前端需重采样
- **声道**：
  - 单声道（Mono）更适合语音识别
  - 双声道需合并或提取首通道

---

## 三、现代浏览器扩展方式

1. **AudioWorklet 替代 ScriptProcessor**
   - ScriptProcessor 已被废弃，AudioWorklet 支持低延迟、可并行
   - 可做复杂 DSP、滤波、特效处理
2. **MediaStreamTrackProcessor / MediaStreamTrackGenerator**
   - Chrome 新增接口
   - 可以直接对音频轨道做流式处理
   - 可与 WebCodecs 联动
3. **Web Codecs（AudioDecoder / AudioEncoder）**
   - 对音频进行高效解码 / 编码
   - 用于需要精细控制音频编码的场景（如低延迟流媒体）

---

## 四、选择策略总结

- **普通录音** → MediaRecorder 即可  
- **精确控制 / 转码 / 统一格式** → ScriptProcessor 或 AudioWorklet  
- **音频分析 / 视觉化** → AnalyserNode / AudioContext  
- **专业低延迟处理** → AudioWorklet + Web Codecs  
- **语音识别（无需上传文件）** → Web Speech API  

> 核心思路：**能力优先 → 数据可控 → 格式统一 → 输出标准化**，保证后端或 ASR 模块接收稳定音频。
