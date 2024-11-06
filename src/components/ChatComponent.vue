<template>
  <div class="container">
    <CharactersList @select-character="handleCharacterSelect" @add-to-chat="handleAddToChat" />
    <ChatArea ref="chatArea" />
    <HistorySidebar @select-session="handleSessionSelect" />
  </div>
</template>

<script>
import CharactersList from './CharactersList.vue'
import ChatArea from './ChatArea.vue'
import HistorySidebar from './HistorySidebar.vue'

export default {
  name: 'ChatComponent',
  components: {
    CharactersList,
    ChatArea,
    HistorySidebar
  },
  methods: {
    handleCharacterSelect(character) {
      // 处理选择角色的逻辑
      console.log('Selected character:', character)
    },
    handleSessionSelect(sessionId) {
      // 更新聊天区域的会话
      this.$refs.chatArea.currentSessionId = sessionId
      this.$refs.chatArea.fetchChatSession()
    },
    handleAddToChat(character) {
      // 处理添加角色到聊天的逻辑
      console.log('Adding character to chat:', character)
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