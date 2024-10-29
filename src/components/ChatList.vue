<template>
    <div class="chat-list">
        <ul>
            <li v-for="conversation in conversations" :key="conversation.id" @click="selectConversation(conversation.id)">
                {{ conversation.title }}
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'ChatList',
    data() {
        return {
            conversations: [],
        };
    },
    created() {
        this.fetchConversations();
    },
    methods: {
        fetchConversations() {
            // Assuming you have an API endpoint to fetch conversations
            fetch('/api/conversations')
                .then(response => response.json())
                .then(data => {
                    this.conversations = data;
                });c
        },
        selectConversation(conversationId) {
            this.$emit('selectConversation', conversationId);
        }
    }
};
</script>

<style scoped>
.chat-list {
    width: 30%;
    border-right: 1px solid #ccc;
}

.chat-list ul {
    list-style: none;
    padding: 0;
}

.chat-list li {
    padding: 10px;
    cursor: pointer;
}

.chat-list li:hover {
    background-color: #f0f0f0;
}
</style>