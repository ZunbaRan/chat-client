<template>
  <div class="container">
    <CharactersList 
      @select-character="handleCharacterSelect" 
      @add-to-chat="handleAddToChat"
      :currentSessionId="currentSessionId"
    />
    <ChatArea ref="chatArea" :sessionId="currentSessionId" />
    <HistorySidebar @select-session="handleSessionSelect" />
  </div>
</template>

<script>
import CharactersList from './CharactersList.vue'
import ChatArea from './ChatArea.vue'
import HistorySidebar from './HistorySidebar.vue'
import { API_ROUTES } from '../config/api'

export default {
  name: 'ChatComponent',
  components: {
    CharactersList,
    ChatArea,
    HistorySidebar
  },
  data() {
    return {
      currentSessionId: 1 // 默认会话ID
    }
  },
  methods: {
    handleCharacterSelect(character) {
      console.log('Selected character:', character)
    },
    handleSessionSelect(sessionId) {
      this.currentSessionId = sessionId
      this.$refs.chatArea.fetchChatSession()
    },
    async handleAddToChat(character) {
      try {
        const response = await fetch(
          API_ROUTES.ADD_AI_TO_SESSION(this.currentSessionId, character.id), 
          { method: 'POST' }
        )
        const data = await response.json()
        
        if (data.code === 200) {
          alert('已添加此角色到聊天')
          // 刷新聊天内容
          this.$refs.chatArea.fetchChatSession()
        } else {
          throw new Error(data.message || '添加失败')
        }
      } catch (error) {
        alert('添加失败: ' + error.message)
      }
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  height: 100vh;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}
</style> 