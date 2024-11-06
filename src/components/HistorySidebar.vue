<template>
  <div class="history-sidebar">
    <div class="list-header">Historical Chat Topics</div>
    <ul class="list history-list">
      <li v-for="topic in topics" 
          :key="topic.id" 
          class="list-item"
          @click="selectSession(topic.id)">
        <div class="topic-name">{{ topic.name }}</div>
        <div class="topic-date">{{ formatDate(topic.createdAt) }}</div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'HistorySidebar',
  data() {
    return {
      topics: [
        { 
          id: 1, 
          name: '关于 AI 的讨论',
          createdAt: '2024-10-31T18:15:01.648Z'
        },
        // 更多主题...
      ]
    }
  },
  methods: {
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    selectSession(id) {
      this.$emit('select-session', id)
    }
  }
}
</script>

<style scoped>
.history-sidebar {
  width: 250px;
  background-color: #ffffff;
  padding: 20px;
}

.list-header {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.list {
  list-style: none;
  padding: 0;
}

.list-item {
  padding: 10px;
  border: 1px solid #e1e1e6;
  border-radius: 8px;
  margin-bottom: 5px;
  cursor: pointer;
}

.list-item:hover {
  background-color: #f5f5f7;
  border-color: #007bff;
}

.topic-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.topic-date {
  font-size: 0.8em;
  color: #666;
}

@media (max-width: 768px) {
  .history-sidebar {
    width: 100%;
  }
}
</style> 