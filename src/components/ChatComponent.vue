<template>
  <div class="container">
    <CharactersList 
      ref="charactersList"
      @select-character="handleCharacterSelect" 
      @add-to-chat="handleAddToChat"
      @show-dialog="handleShowDialog"
      :currentSessionId="currentSessionId"
    />
    <ChatArea ref="chatArea" :sessionId="currentSessionId" />
    <HistorySidebar @select-session="handleSessionSelect" />

    <EditCharacterDialog
      :visible="showDialog"
      :character="selectedCharacter"
      :is-new="!selectedCharacter?.id"
      @close="handleCloseDialog"
      @save="handleSaveCharacter"
    />

    <Toast 
      :visible="toast.show"
      :message="toast.message"
      :type="toast.type"
    />
  </div>
</template>

<script>
import CharactersList from './CharactersList.vue'
import ChatArea from './ChatArea.vue'
import HistorySidebar from './HistorySidebar.vue'
import EditCharacterDialog from './EditCharacterDialog.vue'
import Toast from './Toast.vue'
import { API_ROUTES } from '../config/api'

export default {
  name: 'ChatComponent',
  components: {
    CharactersList,
    ChatArea,
    HistorySidebar,
    EditCharacterDialog,
    Toast
  },
  data() {
    return {
      currentSessionId: 1,
      showDialog: false,
      selectedCharacter: null,
      toast: {
        show: false,
        message: '',
        type: 'success',
        timer: null
      }
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
    showToast(message, type = 'success') {
      if (this.toast.timer) {
        clearTimeout(this.toast.timer)
      }

      this.toast.show = true
      this.toast.message = message
      this.toast.type = type

      this.toast.timer = setTimeout(() => {
        this.toast.show = false
      }, 2000)
    },
    async handleAddToChat(character) {
      try {
        const response = await fetch(
          API_ROUTES.ADD_AI_TO_SESSION(this.currentSessionId), 
          { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              aiProfileIds: [character.id]
            })
          }
        )
        const data = await response.json()
        
        if (data.code === 200) {
          this.showToast('已添加此角色到聊天')
          this.$refs.chatArea.fetchChatSession()
        } else {
          throw new Error(data.message || '添加失败')
        }
      } catch (error) {
        this.showToast(error.message || '添加失败', 'error')
      }
    },
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
          await this.$refs.charactersList.fetchCharacters()
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