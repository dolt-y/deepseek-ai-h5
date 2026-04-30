#!/bin/bash
###
 # @Description: 
 # @Author: wen.yao
 # @LastEditTime: 2025-12-05 16:49:46
### 

# 异步语音识别接口测试脚本

# 服务器地址
SERVER_URL="${SERVER_URL:-http://10.3.20.101:3000}"
TOKEN="${TOKEN:-}"

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
    echo "TOKEN=your_jwt SERVER_URL=http://localhost:3000 ./test_speech_api.sh"
    echo ""
    exit 1
fi

if [ -z "$TOKEN" ]; then
    echo "⚠️  请先通过 TOKEN 环境变量传入 Bearer Token"
    echo "示例：TOKEN=your_jwt SERVER_URL=http://localhost:3000 ./test_speech_api.sh"
    exit 1
fi

echo "正在测试异步语音识别接口..."
echo "服务器地址: $SERVER_URL"
echo "测试文件: $TEST_AUDIO"
echo ""

CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@$TEST_AUDIO" \
  "$SERVER_URL/api/ai/speech-to-text/jobs")

echo "创建任务响应:"
echo "$CREATE_RESPONSE"
echo ""

JOB_ID=$(echo "$CREATE_RESPONSE" | sed -n 's/.*"jobId":"\{0,1\}\([^",}]*\)"\{0,1\}.*/\1/p')

if [ -z "$JOB_ID" ]; then
    echo "未能解析 jobId，请检查创建任务响应"
    exit 1
fi

echo "任务 ID: $JOB_ID"
echo "查询任务状态:"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$SERVER_URL/api/ai/speech-to-text/jobs/$JOB_ID"

echo ""
echo "测试完成！"
