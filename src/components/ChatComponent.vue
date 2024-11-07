<template>
  <div class="container">
    <CharactersList 
      @select-character="handleCharacterSelect" 
      @add-to-chat="handleAddToChat"
      @show-dialog="handleShowDialog"
      :currentSessionId="currentSessionId"
    />
    <ChatArea ref="chatArea" :sessionId="currentSessionId" />
    <HistorySidebar @select-session="handleSessionSelect" />

    <!-- 添加 EditCharacterDialog 组件 -->
    <EditCharacterDialog
      :visible="showDialog"
      :character="selectedCharacter"
      :is-new="!selectedCharacter?.id"
      @close="handleCloseDialog"
      @save="handleSaveCharacter"
    />
  </div>
</template>

<script>
import CharactersList from './CharactersList.vue'
import ChatArea from './ChatArea.vue'
import HistorySidebar from './HistorySidebar.vue'
import EditCharacterDialog from './EditCharacterDialog.vue'
import { API_ROUTES } from '../config/api'

export default {
  name: 'ChatComponent',
  components: {
    CharactersList,
    ChatArea,
    HistorySidebar,
    EditCharacterDialog
  },
  data() {
    return {
      currentSessionId: 1, // 默认会话ID
      showDialog: false,
      selectedCharacter: null
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
    },
    // 新增的方法
    handleShowDialog(character) {
      this.selectedCharacter = character
      this.showDialog = true
    },
    handleCloseDialog() {
      this.showDialog = false
      this.selectedCharacter = null
    },
    async handleSaveCharacter(character) {
      try {
        const url = character.id 
          ? `${API_ROUTES.CONFIG}/${character.id}`
          : API_ROUTES.CONFIG
        const method = character.id ? 'PATCH' : 'POST'
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(character)
        })
        
        if (response.ok) {
          // 刷新角色列表
          this.$refs.charactersList.fetchCharacters()
          this.handleCloseDialog()
        } else {
          throw new Error('保存失败')
        }
      } catch (error) {
        alert('保存失败: ' + error.message)
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