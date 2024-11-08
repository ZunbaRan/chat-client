<template>
  <div class="chat-area">
    <div class="chat-header">
      <div class="header-title">{{ session.topic || 'Loading...' }}</div>
      <div class="ai-profiles" v-if="session.aiProfiles && session.aiProfiles.length">
        <div v-for="ai in aiProfilesWithDetails" 
             :key="ai.id" 
             class="ai-profile"
             :title="`${ai.name} (${ai.businessType === 'question' ? '提问者' : '回答者'})`">
          <div class="avatar" v-if="ai.avatar">
            <img :src="ai.avatar" :alt="ai.name">
          </div>
          <div class="avatar" v-else>
            {{ getInitials(ai.name) }}
          </div>
          <span class="ai-name">{{ ai.name }}</span>
          <span class="ai-type-badge" :class="ai.businessType">
            {{ ai.businessType === 'question' ? 'Q' : 'A' }}
          </span>
        </div>
      </div>
      <div v-if="!canStartChat" class="chat-warning">
        ⚠️ 需要至少一个提问者和一个回答者才能开始对话
      </div>
    </div>
    <div class="chat-messages">
      <div v-for="message in session.messages" 
           :key="message.id"
           class="message-item"
           :class="{ 'ai-message': message.type === 'ai', 'user-message': message.type !== 'ai' }">
        <div class="message-header">
          <span class="message-sender">
            {{ message.type === 'ai' ? getAiName(message.aiId) : 'User' }}
          </span>
          <span class="message-time">{{ formatTime(message.createdAt) }}</span>
        </div>
        <div class="message-content">{{ message.content }}</div>
        <div class="message-avatar" v-if="message.type === 'ai'">
          <div class="avatar" v-if="getAiAvatar(message.aiId)">
            <img :src="getAiAvatar(message.aiId)" :alt="getAiName(message.aiId)">
          </div>
          <div class="avatar" v-else>
            {{ getInitials(getAiName(message.aiId)) }}
          </div>
        </div>
        <div class="message-avatar user-avatar" v-else>
          <div class="avatar">
            <span>U</span>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-footer">
      <input 
        v-model="message" 
        type="text" 
        class="chat-input" 
        placeholder="Type a message..."
        @keyup.enter="handleSendMessage"
        :disabled="!canStartChat"
      >
      <button 
        class="send-button" 
        @click="handleSendMessage"
        :disabled="!canStartChat"
      >Send</button>
    </div>
  </div>
</template>

<script>
import { API_ROUTES } from '../config/api'

export default {
  name: 'ChatArea',
  props: {
    sessionId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      session: {
        topic: '',
        messages: [],
        aiProfiles: []
      },
      message: '',
      charactersList: [],
      autoReplyConfig: {
        maxRepliesPerAI: 3,
        maxTotalReplies: 10
      },
      aiReplyCount: {}, // 记录每个AI的回复次数
      totalReplyCount: 0, // 记录总回复次数
      isAutoReplying: false, // 标记是否正在自动回复
      isFirstMessage: true, // 添加标记是否是第一条消息
      aiReplyQueue: [], // 存储AI回复顺序队列
      isProcessingQueue: false
    }
  },
  computed: {
    aiProfilesWithDetails() {
      return this.session.aiProfiles.map(profile => {
        const fullProfile = this.charactersList.find(char => char.id === profile.id)
        return {
          ...profile,
          avatar: fullProfile?.avatar || null,
          businessType: fullProfile?.businessType || 'replay'
        }
      })
    },
    canStartChat() {
      const hasQuestioner = this.aiProfilesWithDetails.some(ai => ai.businessType === 'question')
      const hasResponder = this.aiProfilesWithDetails.some(ai => ai.businessType === 'replay')
      return hasQuestioner && hasResponder
    }
  },
  watch: {
    sessionId: {
      handler: 'fetchChatSession',
      immediate: true
    }
  },
  methods: {
    async fetchCharactersList() {
      try {
        const response = await fetch(API_ROUTES.CONFIG)
        const data = await response.json()
        this.charactersList = data
      } catch (error) {
        console.error('Failed to fetch characters:', error)
      }
    },
    async fetchChatSession() {
      try {
        const response = await fetch(API_ROUTES.CHAT_SESSION(this.sessionId))
        const data = await response.json()
        this.session = data
        this.resetCounters()
        this.isFirstMessage = !data.messages || data.messages.length === 0
      } catch (error) {
        console.error('Failed to fetch chat session:', error)
      }
    },
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString()
    },
    getInitials(name) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    },
    async sendMessage() {
      if (!this.message.trim()) return

      try {
        const response = await fetch(API_ROUTES.SEND_MESSAGE(this.sessionId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: this.message
          })
        })

        const data = await response.json()
        
        if (data.id) {
          if (this.isFirstMessage) {
            await this.updateSessionTopic(this.message)
            this.isFirstMessage = false
          }

          this.addMessageToList(data)
          this.message = ''
          this.scrollToBottom()
          
          await this.generateAndProcessAIOrder()
        }
      } catch (error) {
        console.error('Failed to send message:', error)
        alert('发送消息失败，请重试')
      }
    },
    addMessageToList(message) {
      if (!this.session.messages) {
        this.session.messages = []
      }
      this.session.messages.push(message)
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const messagesContainer = this.$el.querySelector('.chat-messages')
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      })
    },
    async generateAndProcessAIOrder() {
      if (this.isProcessingQueue) return

      try {
        const response = await fetch(API_ROUTES.GENERATE_AI_ORDER(this.sessionId), {
            method: 'POST',
        })
        const result = await response.json()

        if (result.code === 200 && Array.isArray(result.data)) {
          this.aiReplyQueue = [...result.data] // 保存AI回复顺序队列
          await this.processAIReplyQueue()
        }
      } catch (error) {
        console.error('Failed to generate AI order:', error)
      }
    },
    async processAIReplyQueue() {
      if (this.isProcessingQueue) return
      this.isProcessingQueue = true

      try {
        while (this.aiReplyQueue.length > 0) {
          const nextAiId = this.aiReplyQueue.shift() // 获取队列中的下一个AI ID
          await this.sendAIReply(nextAiId)
          // 添加随机延迟，使对话更自然
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
        }
      } finally {
        this.isProcessingQueue = false
      }
    },
    async sendAIReply(aiId) {
      try {
        const response = await fetch(API_ROUTES.SEND_MESSAGE(this.sessionId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            profileId: aiId
          })
        })

        const data = await response.json()
        
        if (data.id) {
          this.addMessageToList(data)
          this.scrollToBottom()
          return true
        }
      } catch (error) {
        console.error('AI reply failed:', error)
        return false
      }
    },
    resetCounters() {
      this.aiReplyCount = {}
      this.totalReplyCount = 0
      this.isAutoReplying = false
    },
    getAiAvatar(aiId) {
      const character = this.charactersList.find(char => char.id === aiId)
      return character?.avatar || null
    },
    getAiName(aiId) {
      const character = this.charactersList.find(char => char.id === aiId)
      return character?.name || 'Unknown AI'
    },
    async updateSessionTopic(message) {
      try {
        const newTopic = message.slice(0, 8) + (message.length > 8 ? '...' : '')
        
        await fetch(API_ROUTES.UPDATE_SESSION(this.sessionId), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            topic: newTopic
          })
        })

        this.session.topic = newTopic
      } catch (error) {
        console.error('Failed to update session topic:', error)
      }
    },
    handleSendMessage() {
      if (!this.canStartChat) {
        alert('请确保聊天中至少有一个提问者和一个回答者')
        return
      }
      this.sendMessage()
    }
  },
  created() {
    this.fetchCharactersList()
  }
}
</script>

<style scoped>
.chat-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e1e1e6;
  padding: 10px 20px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.ai-profiles {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 5px 0;
}

.ai-profile {
  position: relative;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background-color: #f8f9fa;
  border-radius: 20px;
  white-space: nowrap;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e1e1e6;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.ai-name {
  font-size: 14px;
  color: #666;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100%;
}

.chat-messages {
  flex-grow: 1;
  padding: 20px;
  background-color: #f9f9fb;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.message-item {
  position: relative;
  padding: 12px;
  border-radius: 12px;
  max-width: 60%;
  min-width: 150px;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.user-message {
  margin-left: auto;
  background-color: #007bff;
  color: white;
  padding-right: 40px;
}

.ai-message {
  margin-right: auto;
  background-color: #ffffff;
  padding-left: 40px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.message-sender {
  font-weight: bold;
}

.message-time {
  font-size: 0.8em;
  opacity: 0.8;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-content {
  word-break: break-word;
  line-height: 1.4;
}

.message-avatar {
  position: absolute;
  bottom: 0;
  width: 32px;
  height: 32px;
}

.ai-message .message-avatar {
  left: -16px;
  bottom: -5px;
}

.user-message .message-avatar {
  right: -16px;
  bottom: -5px;
}

.message-avatar .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e1e1e6;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-avatar .avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar .avatar {
  background-color: #28a745;
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

.ai-type-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.ai-type-badge.question {
  background-color: #17a2b8; /* 提问者使用蓝色 */
}

.ai-type-badge.replay {
  background-color: #28a745; /* 回答者使用绿色 */
}

.chat-warning {
  margin-top: 10px;
  padding: 8px;
  background-color: #fff3cd;
  color: #856404;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.chat-input:disabled,
.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .chat-messages {
    max-width: 700px;
  }

  .message-item {
    max-width: 70%;
  }
}

@media (max-width: 768px) {
  .chat-messages {
    max-width: 100%;
    padding: 10px;
  }

  .message-item {
    max-width: 80%;
  }
}
</style> 