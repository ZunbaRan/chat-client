<template>
  <div class="chat-area">
    <div class="chat-header">
      <div class="header-title">{{ session.topic || 'Loading...' }}</div>
      <div class="ai-profiles-container">
        <div class="ai-profiles" v-if="aiProfiles && aiProfiles.length">
          <div v-for="ai in aiProfilesWithDetails" 
               :key="ai.id" 
               class="ai-profile"
               :title="`${ai.name} (${getBusinessTypeText(ai.businessType)})`"
               @click="handleAiProfileClick(ai, $event)">
            <div class="avatar" v-if="ai.avatar">
              <img :src="ai.avatar" :alt="ai.name">
            </div>
            <div class="avatar" v-else>
              {{ getInitials(ai.name) }}
            </div>
            <span class="ai-name">{{ ai.name }}</span>
            <span class="ai-type-badge" :class="ai.businessType">
              {{ getTypeBadgeText(ai.businessType) }}
            </span>
          </div>

          <div v-if="activeProfile" 
               class="profile-menu"
               :style="menuPosition"
               @click.stop>
            <button class="menu-item remove-btn" @click="removeFromChat(activeProfileData)">
              <span class="remove-icon">✕</span>
              从会话中移除
            </button>
            <button class="menu-item batch-add-btn" @click="handleBatchAdd">
              <span class="add-icon">+</span>
              批量添加角色
            </button>
          </div>
        </div>
        <!-- <button class="batch-add-button" @click="handleBatchAdd" v-if="!isBatchSelecting">
          <span class="add-icon">+</span>
          批量添加
        </button> -->
      </div>
      <div v-if="!canStartChat" class="chat-warning">
        ⚠️ 需要至少添加一个角色才能开始对话
      </div>
    </div>
    <div class="chat-messages">
      <div v-for="message in chatMessages" 
           :key="message.id"
           class="message-item"
           :class="{ 'ai-message': message.type === 'ai', 'user-message': message.type !== 'ai' }">
        <div class="message-header">
          <span class="message-sender">
            {{ message.type === 'ai' ? getAiName(message.aiId) : 'User' }}
          </span>
          <span class="message-time">{{ formatTime(message.createdAt) }}</span>
        </div>
        <div class="message-content markdown-body" v-html="parseMarkdown(message.content)"></div>
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
      
      <div v-if="showContinueButton" class="continue-chat-container">
        <button class="continue-button" @click="handleContinueChat">
          <span class="continue-icon">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill="currentColor"/>
            </svg>
          </span>
          继续对话
        </button>
        <button class="expand-button" @click="handleExpandTopic">
          <span class="expand-icon">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
            </svg>
          </span>
          扩展话题
        </button>
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
      <div class="button-group">
        <button 
          v-if="isProcessingQueue"
          class="stop-button" 
          @click="stopAutoReply"
          title="停止自动回复"
        >
          <svg class="stop-icon" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>
        <button 
          class="send-button" 
          @click="handleSendMessage"
          :disabled="!canStartChat"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'
import { API_ROUTES } from '../config/api'

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true,    // 启用 GitHub 风格的 Markdown
  sanitize: false, // 允许 HTML 标签
  highlight: function (code) {
    // 如果需要代码高亮，可以在这里集成 highlight.js 等库
    return code
  }
})

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
      isProcessingQueue: false,
      activeProfile: null, // 添加激活的角色状态
      activeProfileData: null,
      menuPosition: {
        top: '0px',
        left: '0px'
      },
      chatMessages: [], // 存储所有消息
      currentPage: 1,
      pageSize: 10,
      totalMessages: 0,
      isLoading: false,
      hasMore: true,
      aiProfiles: [], // 新增存储 AI 配置的数组
      isBatchSelecting: false
    }
  },
  computed: {
    aiProfilesWithDetails() {
      return this.aiProfiles
    },
    canStartChat() {
      return this.aiProfiles && this.aiProfiles.length > 0
    },
    showContinueButton() {
      return this.chatMessages?.length > 0 && 
             !this.isProcessingQueue &&
             this.canStartChat
    }
  },
  watch: {
    sessionId: {
      handler: 'fetchChatSession',
      immediate: true
    }
  },
  mounted() {
    // 点击其他区域关闭菜单
    document.addEventListener('click', this.closeProfileMenu)
    
    // 添加滚动监听
    const messagesContainer = this.$el.querySelector('.chat-messages')
    messagesContainer.addEventListener('scroll', this.handleScroll)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeProfileMenu)
    
    // 移除滚动监听
    const messagesContainer = this.$el.querySelector('.chat-messages')
    messagesContainer.removeEventListener('scroll', this.handleScroll)
  },
  methods: {
    async fetchAiProfiles() {
      try {
        const response = await fetch(API_ROUTES.CHAT_SESSION_AI_PROFILES(this.sessionId))
        const data = await response.json()
        this.aiProfiles = data
      } catch (error) {
        console.error('Failed to fetch AI profiles:', error)
      }
    },
    async fetchChatSession() {
      try {
        // 获取会话主题
        const response = await fetch(API_ROUTES.CHAT_SESSION(this.sessionId))
        const data = await response.json()
        this.session.topic = data.topic
        
        // 获取 AI 配置列表
        await this.fetchAiProfiles()
        
        // 重置分页相关数据
        this.currentPage = 1
        this.chatMessages = []
        this.hasMore = true
        
        // 获取第一页消息
        await this.fetchMessages()
        
        this.resetCounters()
        this.isFirstMessage = !this.chatMessages.length
      } catch (error) {
        console.error('Failed to fetch chat session:', error)
      }
    },
    async fetchMessages() {
      if (this.isLoading || !this.hasMore) return

      this.isLoading = true
      try {
        const response = await fetch(API_ROUTES.CHAT_SESSION_PAGE(this.sessionId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page: this.currentPage,
            limit: this.pageSize
          })
        })

        const result = await response.json()
        
        // 更新消息列表 - 改为在末尾添加新消息
        this.chatMessages = [...this.chatMessages, ...result.data]
        this.totalMessages = result.total
        
        // 更新分页状态
        this.hasMore = this.chatMessages.length < this.totalMessages
        if (this.hasMore) {
          this.currentPage++
        }

        // 更新 session.messages 以保持兼容性
        this.session.messages = this.chatMessages
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        this.isLoading = false
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
      if (!this.chatMessages) {
        this.chatMessages = []
      }
      this.chatMessages.push(message)
      // 更新 session.messages 以保持兼容性
      this.session.messages = this.chatMessages
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
          if (!this.isProcessingQueue) {
            console.log('Queue processing interrupted')
            break
          }

          const nextAiId = this.aiReplyQueue.shift()
          await this.sendAIReply(nextAiId)

          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
        }
      } finally {
        this.isProcessingQueue = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
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
      const profile = this.aiProfiles.find(profile => profile.id === aiId)
      return profile?.avatar || null
    },
    getAiName(aiId) {
      const profile = this.aiProfiles.find(profile => profile.id === aiId)
      return profile?.name || 'Unknown AI'
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
        alert('请至少添加一个角色到对话中')
        return
      }
      this.sendMessage()
    },
    parseMarkdown(content) {
      try {
        return marked(content)
      } catch (error) {
        console.error('Markdown parsing error:', error)
        return content // 如果解析失败，返回原始内容
      }
    },
    getTypeBadgeText(type) {
      switch (type) {
        case 'question':
          return 'Q'
        case 'replay':
          return 'A'
        case 'content_creator':
          return 'C'
        default:
          return 'A'
      }
    },
    getBusinessTypeText(type) {
      switch (type) {
        case 'question':
          return '提问者'
        case 'replay':
          return '回答者'
        case 'content_creator':
          return '内容创作者'
        default:
          return '回答者'
      }
    },
    stopAutoReply() {
      // 清空队列并停止处理
      this.aiReplyQueue = []
      this.isProcessingQueue = false
    },
    async handleContinueChat() {
      if (this.isProcessingQueue) return
      await this.generateAndProcessAIOrder()
    },
    handleAiProfileClick(ai, event) {
      event.stopPropagation()
      
      if (this.activeProfile === ai.id) {
        this.activeProfile = null
        this.activeProfileData = null
        return
      }
      
      const element = event.currentTarget
      const rect = element.getBoundingClientRect()
      
      this.menuPosition = {
        top: `${rect.bottom + 5}px`,
        left: `${rect.left + (rect.width / 2)}px`
      }
      
      this.activeProfile = ai.id
      this.activeProfileData = ai
    },

    closeProfileMenu(event = null) {
      if (event && (event.target.closest('.profile-menu') || event.target.closest('.ai-profile'))) {
        return
      }
      this.activeProfile = null
      this.activeProfileData = null
    },

    async removeFromChat(ai) {
      try {
        const response = await fetch(
          `${API_ROUTES.REMOVE_AI_FROM_SESSION(this.sessionId, ai.id)}`,
          { 
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (response.ok) {
          await this.fetchChatSession()
          this.closeProfileMenu()
          this.$parent.showToast('已从对话中移除该角色')
        } else {
          throw new Error('移除失败')
        }
      } catch (error) {
        console.error('Failed to remove AI from chat:', error)
        this.$parent.showToast('移除失败: ' + error.message, 'error')
      }
    },
    handleScroll(event) {
      const element = event.target
      const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight
      
      // 当距离底部小于 50px 时加载更多消息
      if (scrollBottom < 50 && !this.isLoading && this.hasMore) {
        this.fetchMessages()
      }
    },
    async handleExpandTopic() {
      try {
        const response = await fetch(API_ROUTES.EXPAND_TOPIC(this.sessionId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        const result = await response.json()
        
        // 创建一个系统消息来显示扩展内容
        const message = {
          id: Date.now(), // 临时ID
          type: 'system',
          content: `${result.keywords}\n\n${result.story}`,
          createdAt: new Date().toISOString()
        }

        this.addMessageToList(message)
        this.scrollToBottom()
      } catch (error) {
        console.error('Failed to expand topic:', error)
        this.$parent.showToast('扩展话题失败: ' + error.message, 'error')
      }
    },
    handleBatchAdd() {
      this.isBatchSelecting = true
      this.closeProfileMenu()
      // 通知父组件进入批量选择模式
      this.$parent.$refs.charactersList.enterBatchSelectMode()
    }
  },
  created() {
    // 如果需要在组件创建时执行其他初始化操作，可以在这里添加
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

.ai-profiles-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.batch-add-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 15px;
  border: 1px dashed #007bff;
  background: transparent;
  color: #007bff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.batch-add-button:hover {
  background: rgba(0, 123, 255, 0.1);
}

.add-icon {
  font-size: 16px;
  font-weight: bold;
}

.ai-profiles {
  position: relative;
  display: flex;
  flex-wrap: nowrap; /* 防止换行 */
  gap: 10px;
  padding: 5px 0;
  overflow-x: auto; /* 只在需要时显示横向滚动条 */
  overflow-y: hidden; /* 隐藏纵向滚动条 */
  scrollbar-width: thin; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  min-width: 0; /* 允许容器收缩 */
  flex: 1; /* 占据剩余空间 */
}

/* 隐藏 Webkit 浏览器的滚动条，但保持功能 */
.ai-profiles::-webkit-scrollbar {
  height: 6px; /* 横向滚动条高度 */
}

/* 只在hover时显示滚动条 */
.ai-profiles:not(:hover)::-webkit-scrollbar {
  display: none;
}

.ai-profiles::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.ai-profiles::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.ai-profiles::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0; /* 防止元素被压缩 */
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
  padding: 0;
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
  max-width: 1000px;
  margin: 0 auto;
  box-sizing: border-box;
  position: relative;
}

.message-item {
  position: relative;
  padding: 12px;
  border-radius: 12px;
  max-width: 70%;
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
  align-items: center;
  gap: 8px;
}

.chat-input {
  flex-grow: 1;
  border: 1px solid #e1e1e6;
  border-radius: 15px;
  padding: 10px;
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
  padding: 8px 20px;
  height: 36px; /* 固定高度 */
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
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

.ai-type-badge.content_creator {
  background-color: #fd7e14; /* 内容创作者使用橙色 */
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
    max-width: 900px;
  }

  .message-item {
    max-width: 75%;
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

  .chat-footer {
    padding: 8px 12px;
  }

  .button-group {
    gap: 2px;
  }

  .stop-button {
    width: 32px;
    height: 32px;
  }

  .send-button {
    height: 32px;
    padding: 6px 16px;
  }
}

/* Markdown 样式 */
.markdown-body {
  line-height: 1.6;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-body :deep(p) {
  margin: 0.5em 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  font-family: monospace;
}

.markdown-body :deep(pre) {
  padding: 1em;
  background-color: #f6f8fa;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background-color: transparent;
}

.markdown-body :deep(blockquote) {
  margin: 0.5em 0;
  padding-left: 1em;
  border-left: 4px solid #ddd;
  color: #666;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 6px 12px;
  border: 1px solid #ddd;
}

.markdown-body :deep(th) {
  background-color: #f6f8fa;
}

/* 针对用户消息的暗色主题样式 */
.user-message .markdown-body {
  color: white;
}

.user-message .markdown-body :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-message .markdown-body :deep(pre) {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-message .markdown-body :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
}

.user-message .markdown-body :deep(a) {
  color: #fff;
  text-decoration: underline;
}

.button-group {
  display: flex;
  gap: 4px; /* 减小按钮之间的间距 */
  align-items: center;
}

.stop-button {
  background-color: #da727d;
  color: white;
  border: none;
  border-radius: 35px;
  width: 36px; /* 固定宽度 */
  height: 36px; /* 固定高度，与发送按钮高度一致 */
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
}

.stop-button:hover {
  background-color: #c82333;
  transform: scale(1.05);
}

.stop-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(220, 53, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
  }
}

.continue-chat-container {
  display: flex;
  justify-content: center;
  gap: 10px; /* 添加按钮之间的间距 */
  margin: 20px 0;
  padding: 10px;
}

.continue-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(to bottom, #ffffff, #f7f7f7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  color: #007AFF;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.continue-button:hover {
  background: linear-gradient(to bottom, #f7f7f7, #f0f0f0);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.continue-button:active {
  transform: translateY(0);
  background: linear-gradient(to bottom, #f0f0f0, #e8e8e8);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.continue-icon {
  display: flex;
  align-items: center;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

/* 适配深色模式 */
@media (prefers-color-scheme: dark) {
  .continue-button {
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    border-color: rgba(255, 255, 255, 0.2);
    color: #0A84FF;
  }

  .continue-button:hover {
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1));
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .continue-button {
    padding: 6px 12px;
    font-size: 13px;
  }
}

.profile-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 140px;
  transform: translateX(-50%);
}

.profile-menu::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background-color: white;
  box-shadow: -2px -2px 5px rgba(0, 0, 0, 0.05);
}

.profile-menu::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background-color: white;
  border-radius: 8px 8px 0 0;
}

.menu-item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.menu-item + .menu-item {
  margin-top: 2px;
}

.remove-btn {
  color: #dc3545;
}

.remove-btn:hover {
  background-color: #fff1f1;
}

.batch-add-btn {
  color: #28a745;
}

.batch-add-btn:hover {
  background-color: #f0fff4;
}

.add-icon {
  font-size: 14px;
  font-weight: bold;
}

/* 添加加载状态的样式 */
.loading-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

/* 添加平滑滚动 */
.chat-messages {
  scroll-behavior: smooth;
}

.expand-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(to bottom, #ffffff, #f7f7f7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  color: #28a745; /* 使用绿色来区分 */
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.expand-button:hover {
  background: linear-gradient(to bottom, #f7f7f7, #f0f0f0);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.expand-button:active {
  transform: translateY(0);
  background: linear-gradient(to bottom, #f0f0f0, #e8e8e8);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.expand-icon {
  display: flex;
  align-items: center;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 适配深色模式 */
@media (prefers-color-scheme: dark) {
  .expand-button {
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    border-color: rgba(255, 255, 255, 0.2);
    color: #2ecc71;
  }
}
</style> 