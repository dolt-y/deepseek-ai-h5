#!/bin/bash
###
 # @Description: 
 # @Author: wen.yao
 # @LastEditTime: 2025-12-05 16:49:46
### 

# 语音识别接口测试脚本

# 服务器地址
SERVER_URL="http://10.3.20.101:3000/api/ai/speech-to-text"

# 测试语音文件路径
TEST_AUDIO="test_audio.wav"

# 检查测试文件是否存在
if [ ! -f "$TEST_AUDIO" ]; then
    echo "⚠️  测试语音文件 '$TEST_AUDIO' 不存在！"
    echo ""
    echo "=== 测试指南 ==="
    echo "1. 录制一个简单的中文语音文件（如：'你好，这是一个测试'）"
    echo "2. 保存为 WAV 格式，命名为 $TEST_AUDIO，放在项目根目录"
    echo "3. 然后重新运行此测试脚本"
    echo ""
    echo "=== 手动测试命令 ==="
    echo "如果您有自己的音频文件，可以使用以下命令进行测试："
    echo "curl -X POST -H 'Content-Type: multipart/form-data' -F 'audio=@your_audio_file.wav' $SERVER_URL"
    echo ""
    exit 1
fi

echo "正在测试语音识别接口..."
echo "服务器地址: $SERVER_URL"
echo "测试文件: $TEST_AUDIO"
echo ""

# 使用curl发送POST请求测试接口
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@$TEST_AUDIO" \
  $SERVER_URL

echo ""
echo "测试完成！"