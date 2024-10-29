<template>
    <div class="chat-window">
      <div v-if="conversation">
        <h3>{{ conversation.title }}</h3>
        <div class="messages">
          <div v-for="message in conversation.messages" :key="message.id">
            <strong>{{ message.sender }}:</strong> {{ message.text }}
          </div>
        </div>
        <form @submit.prevent="sendMessage">
          <input type="text" v-model="newMessage" placeholder="Type a message"/>
          <button type="submit">Send</button>
        </form>
      </div>
      <div v-else>
        <p>Select a conversation to start chatting.</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ChatWindow',
    props: ['conversationId'],
    data() {
      return {
        conversation: null,
        newMessage: '',
      };
    },
    watch: {
      conversationId: {
        immediate: true,
        handler(newValue) {
          if (newValue) {
            this.fetchConversation(newValue);
          }
        }
      }
    },
    methods: {
      fetchConversation(conversationId) {
        // Assuming you have an API endpoint to fetch a specific conversation by ID
        fetch(`/api/conversations/${conversationId}`)
          .then(response => response.json())
          .then(data => {
            this.conversation = data;
          });
      },
      sendMessage() {
        if (this.newMessage.trim()) {
          // Assuming you have an API endpoint to send a message
          fetch(`/api/conversations/${this.conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: this.newMessage })
          })
          .then(response => response.json())
          .then(message => {
            this.conversation.messages.push(message);
            this.newMessage = '';
          });
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .chat-window {
    width: 70%;
    padding: 20px;
  }
  .messages {
    border: 1px solid #ccc;
    padding: 10px;
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 10px;
  }
  .messages div {
    margin-bottom: 5px;
  }
  form {
    display: flex;
  }
  input {
    flex: 1;
    padding: 10px;
    margin-right: 10px;
  }
  button {
    padding: 10px;
  }
  </style>
  