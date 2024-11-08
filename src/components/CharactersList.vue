<template>
  <div class="sidebar">
    <div class="list-header">
      <span>Characters List</span>
      <button class="add-button" @click="$emit('show-dialog', {})">
        <i class="fas fa-plus"></i> Add New
      </button>
    </div>
    <div class="characters-container">
      <ul class="list characters-list">
        <li v-for="character in characters" 
            :key="character.id" 
            class="list-item"
            :class="{ 'active': activeCharacter === character.id }"
            @click="handleItemClick(character, $event)">
          <div class="character-info">
            <div class="avatar" v-if="character.avatar">
              <img :src="character.avatar" alt="avatar">
            </div>
            <div class="avatar" v-else>
              {{ getInitials(character.name) }}
            </div>
            <span class="name">{{ character.name }}</span>
            <span class="ai-type-badge" :class="character.businessType">
              {{ character.businessType === 'question' ? 'Q' : 'A' }}
            </span>
          </div>

          <!-- 悬浮菜单 -->
          <div v-if="activeCharacter" 
               class="floating-menu-container">
            <div class="floating-menu"
                 :style="menuPosition">
              <div class="menu-arrow"></div>
              <button class="menu-btn edit" @click.stop="handleEdit(getActiveCharacter())">
                <span class="btn-icon">✏️</span>
                <span class="btn-text">Edit</span>
              </button>
              <button class="menu-btn delete" @click.stop="handleDelete(getActiveCharacter())">
                <span class="btn-icon">🗑️</span>
                <span class="btn-text">Delete</span>
              </button>
              <button class="menu-btn add-chat" @click.stop="addToChat(getActiveCharacter())">
                <span class="btn-icon">💬</span>
                <span class="btn-text">Add to Chat</span>
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { API_ROUTES } from '../config/api'

export default {
  name: 'CharactersList',
  data() {
    return {
      characters: [],
      activeCharacter: null,
      menuPosition: {
        top: '0px',
        left: '0px'
      }
    }
  },
  mounted() {
    // 点击其他区域关闭菜单
    document.addEventListener('click', this.closeMenu)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeMenu)
  },
  methods: {
    getInitials(name) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    },
    async fetchCharacters() {
      try {
        const response = await fetch(API_ROUTES.CONFIG)
        const data = await response.json()
        this.characters = data
      } catch (error) {
        console.error('Failed to fetch characters:', error)
      }
    },
    handleEdit(character) {
      this.$emit('show-dialog', character)
    },
    async handleDelete(character) {
      if (confirm('Are you sure you want to delete this character?')) {
        try {
          await fetch(`${API_ROUTES.CONFIG}/${character.id}`, {
            method: 'DELETE'
          })
          await this.fetchCharacters()
        } catch (error) {
          console.error('Failed to delete character:', error)
        }
      }
    },
    handleItemClick(character, event) {
      event.stopPropagation()
      
      // 如果点击的是同一个角色，则关闭菜单
      if (this.activeCharacter === character.id) {
        this.activeCharacter = null
        return
      }

      // 获取列表项的位置信息
      const listItem = event.currentTarget
      const rect = listItem.getBoundingClientRect()
      
      // 设置菜单位置
      this.menuPosition = {
        top: `${rect.top}px`,
        left: `${rect.right + 10}px` // 在列表项右侧10px处
      }
      
      this.activeCharacter = character.id
    },

    closeMenu() {
      this.activeCharacter = null
    },

    addToChat(character) {
      this.$emit('add-to-chat', character)
      this.closeMenu()
    },

    getActiveCharacter() {
      return this.characters.find(c => c.id === this.activeCharacter)
    }
  },
  created() {
    this.fetchCharacters()
  }
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #ffffff;
  height: 100vh; /* 设置整体高度 */
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 20px 20px 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-bottom: 1px solid #e1e1e6;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.characters-container {
  flex-grow: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 启用垂直滚动 */
  padding: 10px 20px;
}

/* 自定义滚动条样式 */
.characters-container::-webkit-scrollbar {
  width: 6px;
}

.characters-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.characters-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.characters-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e1e1e6;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  background-color: #ffffff;
  cursor: pointer;
}

.list-item.active {
  background-color: #f0f7ff;
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
  background-color: #e1e1e6;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.character-info {
  position: relative;
  display: flex;
  align-items: center;
  flex-grow: 1;
  cursor: pointer;
  padding-right: 25px;
}

.ai-type-badge {
  position: absolute;
  top: -5px;
  right: 0;
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
  background-color: #17a2b8;
}

.ai-type-badge.replay {
  background-color: #28a745;
}

.actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.action-btn .btn-icon {
  margin-right: 4px;
  font-size: 16px;
}

.action-btn.edit {
  color: #0056b3;
  border-color: #0056b3;
}

.action-btn.edit:hover {
  background-color: #0056b3;
  color: white;
}

.action-btn.delete {
  color: #dc3545;
  border-color: #dc3545;
}

.action-btn.delete:hover {
  background-color: #dc3545;
  color: white;
}

.name {
  margin-left: 10px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    max-height: 40vh; /* 在移动端限制最大高度 */
  }

  .characters-container {
    max-height: calc(40vh - 60px); /* 减去header高度 */
  }

  .action-btn .btn-text {
    display: none;
  }
  
  .action-btn {
    padding: 6px;
  }
  
  .action-btn .btn-icon {
    margin: 0;
  }
}

@media (max-width: 480px) {
  .list-item {
    padding: 8px;
  }
  
  .actions {
    gap: 4px;
  }
}

.floating-menu-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none; /* 允许点击穿透到底层 */
}

.floating-menu {
  position: fixed; /* 改为 fixed 定位 */
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 150px;
  pointer-events: auto; /* 恢复菜单的点击事件 */
}

.menu-arrow {
  position: absolute;
  left: -6px;
  top: 15px;
  width: 12px;
  height: 12px;
  background: white;
  transform: rotate(45deg);
  box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.1);
}

.floating-menu::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 12px;
  background: white;
  z-index: 1;
}

.menu-btn {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.menu-btn .btn-icon {
  margin-right: 8px;
  font-size: 16px;
}

.menu-btn .btn-text {
  flex-grow: 1;
}

.menu-btn:hover {
  background-color: #f5f5f7;
}

.menu-btn.edit:hover {
  background-color: #e3f2fd;
  color: #0056b3;
}

.menu-btn.delete:hover {
  background-color: #fee;
  color: #dc3545;
}

.menu-btn.add-chat:hover {
  background-color: #e8f5e9;
  color: #28a745;
}

.list-item {
  position: relative;
  cursor: pointer;
}

/* 确保菜单按钮在移动端也能正常显示 */
@media (max-width: 768px) {
  .floating-menu {
    position: fixed;
    top: auto !important;
    bottom: 20px;
    left: 50% !important;
    transform: translateX(-50%);
    width: 90%;
    max-width: 300px;
  }

  .menu-arrow {
    display: none; /* 在移动端隐藏箭头 */
  }

  .floating-menu::before {
    display: none;
  }
}
</style> 