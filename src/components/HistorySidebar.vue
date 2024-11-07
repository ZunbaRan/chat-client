<template>
  <div class="history-sidebar">
    <div class="list-header">
      <span>Historical Chat Topics</span>
      <button class="add-button" @click="createNewSession">
        <span class="btn-icon">➕</span>
        <span class="btn-text">New Topic</span>
      </button>
    </div>
    <ul class="list history-list">
      <li v-for="topic in topics" 
          :key="topic.id" 
          class="list-item"
          @click="selectSession(topic.id)">
        <div class="topic-name" :title="topic.topic">
          {{ truncateTopic(topic.topic) }}
        </div>
        <div class="topic-date">{{ formatDate(topic.createdAt) }}</div>
      </li>
    </ul>
  </div>
</template>

<script>
import { API_ROUTES } from '../config/api'

export default {
  name: 'HistorySidebar',
  data() {
    return {
      topics: []
    }
  },
  methods: {
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    selectSession(id) {
      this.$emit('select-session', id)
    },
    truncateTopic(topic) {
      const maxLength = 15 // 设置最大长度
      if (!topic) return '无标题'
      return topic.length > maxLength ? topic.slice(0, maxLength) + '...' : topic
    },
    async createNewSession() {
      try {
        const response = await fetch(API_ROUTES.CREATE_SESSION, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            topic: '新主题'
          })
        })
        
        const data = await response.json()
        if (data.id) {
          await this.fetchTopics()
          this.$emit('select-session', data.id)
        }
      } catch (error) {
        console.error('Failed to create new session:', error)
      }
    },
    async fetchTopics() {
      try {
        const response = await fetch(API_ROUTES.CREATE_SESSION_LIST)
        const data = await response.json()
        this.topics = data
      } catch (error) {
        console.error('Failed to fetch topics:', error)
      }
    }
  },
  created() {
    this.fetchTopics()
  }
}
</script>

<style scoped>
.history-sidebar {
  width: 290px; /* 固定宽度 */
  background-color: #ffffff;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto; /* 允许垂直滚动 */
  height: 100%; /* 使其高度与父容器一致 */
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.add-button:hover {
  background-color: #218838;
}

.list {
  list-style: none;
  padding: 0;
}

.list-item {
  padding: 12px;
  border: 1px solid #e1e1e6;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.list-item:hover {
  background-color: #f5f5f7;
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.topic-name {
  font-weight: 500;
  margin-bottom: 5px;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-date {
  font-size: 0.8em;
  color: #666;
}

@media (max-width: 768px) {
  .history-sidebar {
    width: 100%;
    padding: 15px;
  }

  .list-item {
    padding: 10px;
  }
}
</style> 