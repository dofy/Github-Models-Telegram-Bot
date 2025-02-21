import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from 'dotenv';
dotenv.config();

const token = process.env['GITHUB_TOKEN'];
const endpoint = 'https://models.inference.ai.azure.com';
let modelName = 'gpt-4o'; // 默认模型

// 设置模型名称的函数
export function setModelName(chatId,name) {
    modelName = name; 
    // console.log(`模型已更新为: ${modelName}`); 
    resetUserHistory(chatId);
}

// 使用 Map 来保存每个用户的对话历史
const userHistories = new Map();

// 重置或初始化特定用户的对话历史
function resetUserHistory(userId) {
    userHistories.set(userId, [{ role: 'system', content: 'You are a helpful assistant.' }]);
}

// 获取特定用户的对话历史
function getUserHistory(userId) {
    if (!userHistories.has(userId)) {
        resetUserHistory(userId);
    }
    return userHistories.get(userId);
}

// 更新对话历史
function updateMessageHistory(userId, role, content) {
    const history = getUserHistory(userId);
    history.push({ role, content });
}

// 获取 AI 的响应
export async function getAIResponse(userId, userInput) {
  const client = new ModelClient(endpoint, new AzureKeyCredential(token));
    // 更新用户消息到对话历史
    updateMessageHistory(userId, 'user', userInput);

    const messageHistory = getUserHistory(userId);

    try {
      const response = await client.path("/chat/completions").post({
        body: {
          messages: messageHistory,
          model: modelName
        }
      });
      if (response.status !== "200") {
        throw response.body.error;
      }
    
      for (const choice of response.body.choices) {
        return choice.message.content
      }
    } catch (error) {
      console.error('无法获取响应:', error);
      return '我目前无法处理你的请求，因为遇到了错误：' + error.message;
    }
}

export { resetUserHistory };
