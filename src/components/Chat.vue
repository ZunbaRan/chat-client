<template>
  <div class="chat-container">
    <ChatList @selectConversation="selectConversation"/>
    <ChatWindow :conversationId="selectedConversationId"/>
  </div>
</template>

<script>
import ChatList from './ChatList.vue';
import ChatWindow from './ChatWindow.vue';

export default {
  name: 'Chat',
  components: {
    ChatList,
    ChatWindow
  },
  data() {
    return {
      selectedConversationId: null,
    };
  },
  methods: {
    selectConversation(conversationId) {
      this.selectedConversationId = conversationId;
    }
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
}
</style>
