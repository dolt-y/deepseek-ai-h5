import { execFile, spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Whisper.cpp 封装类
 */
export class Whisper {
    /**
     * @param {string} whisperRoot whisper.cpp 根目录绝对路径
     * @param {string} modelName   模型名称
     */
    constructor(whisperRoot, modelName = "ggml-tiny.bin") {
        this.whisperRoot = whisperRoot;
        this.cliPath = path.resolve(whisperRoot, "build/bin/whisper-cli");
        this.modelPath = path.resolve(whisperRoot, `models/${modelName}`);
    }

    /**
     * 转写音频
     * @param {string} audioFile 绝对路径 audio.wav
     * @param {string} language 默认中文
     * @returns {Promise<string>} 默认自动识别语言，返回文本
     */
    transcribe(audioFile, language = "auto") {
        return new Promise((resolve, reject) => {
            execFile(
                this.cliPath,
                ["-m", this.modelPath, "-f", audioFile, "--language", language, '--no-timestamps'],
                (error, stdout, stderr) => {
                    if (error) {
                        console.error("Whisper 转写失败:", stderr);
                        return reject(error);
                    }
                    resolve(stdout.trim());
                }
            );
        });
    }

    /**
     * 转写音频（流式返回 stdout）
     * @param {string} audioFile
     * @param {string} language
     * @param {(chunk: string) => void} onData 回调每次 stdout data
     * @returns {Promise<string>} 返回完整文本
     */
    transcribeStream(audioFile, language = "auto", onData = null) {
        return new Promise((resolve, reject) => {
            const child = spawn(this.cliPath, ["-m", this.modelPath, "-f", audioFile, "--language", language]);
            let full = "";

            child.stdout.on("data", (data) => {
                const text = data.toString();
                full += text;
                if (typeof onData === "function") {
                    onData(text);
                }
            });

            child.stderr.on("data", (data) => {
                // Whisper 会把进度写入 stderr，这里仅记录
                console.log("Whisper:", data.toString());
            });

            child.on("error", (error) => {
                reject(error);
            });

            child.on("close", (code) => {
                if (code !== 0) {
                    return reject(new Error(`Whisper CLI exited with code ${code}`));
                }
                resolve(full.trim());
            });
        });
    }
}
