<template>
  <div class="chat-area">
    <div class="chat-header">Chat Topic: {{ session.topic || 'Loading...' }}</div>
    <div class="chat-messages">
      <div v-for="message in session.messages" 
           :key="message.id"
           class="message-item"
           :class="{ 'ai-message': message.aiName }">
        <div class="message-header">
          <span class="message-sender">{{ message.aiName || 'User' }}</span>
          <span class="message-time">{{ formatTime(message.createdAt) }}</span>
        </div>
        <div class="message-content">{{ message.content }}</div>
      </div>
    </div>
    <div class="chat-footer">
      <input 
        v-model="message" 
        type="text" 
        class="chat-input" 
        placeholder="Type a message..."
        @keyup.enter="sendMessage"
      >
      <button class="send-button" @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script>
import { API_ROUTES } from '../config/api'

export default {
  name: 'ChatArea',
  data() {
    return {
      session: {
        topic: '',
        messages: []
      },
      message: '',
      currentSessionId: 1 // 默认会话ID
    }
  },
  methods: {
    async fetchChatSession() {
      try {
        const response = await fetch(API_ROUTES.CHAT_SESSION(this.currentSessionId))
        const data = await response.json()
        this.session = data
      } catch (error) {
        console.error('Failed to fetch chat session:', error)
      }
    },
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString()
    },
    sendMessage() {
      if (this.message.trim()) {
        // 这里可以添加发送消息到后端的逻辑
        console.log('Sending message:', this.message)
        this.message = ''
      }
    }
  },
  created() {
    this.fetchChatSession()
  }
}
</script>

<style scoped>
.chat-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e1e1e6;
  padding: 10px 20px;
  font-size: 18px;
  font-weight: bold;
}

.chat-messages {
  flex-grow: 1;
  padding: 20px;
  background-color: #f9f9fb;
  overflow-y: auto;
}

.message-item {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  background-color: #fff;
  max-width: 80%;
}

.ai-message {
  margin-left: auto;
  background-color: #007bff;
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.9em;
}

.message-sender {
  font-weight: bold;
}

.message-time {
  color: #666;
}

.ai-message .message-time {
  color: #e1e1e6;
}

.message-content {
  word-break: break-word;
}

.chat-footer {
  background-color: #ffffff;
  border-top: 1px solid #e1e1e6;
  padding: 10px 20px;
  display: flex;
}

.chat-input {
  flex-grow: 1;
  border: 1px solid #e1e1e6;
  border-radius: 15px;
  padding: 10px;
  margin-right: 10px;
}

.chat-input:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  outline: none;
}

.send-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 15px;
  padding: 10px 20px;
  cursor: pointer;
}

.send-button:hover {
  background-color: #0056b3;
}
</style> 