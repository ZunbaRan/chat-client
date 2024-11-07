<template>
  <div class="sidebar">
    <div class="list-header">
      <span>Characters List</span>
      <button class="add-button" @click="$emit('show-dialog', {})">
        <i class="fas fa-plus"></i> Add New
      </button>
    </div>
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
        </div>

        <!-- 悬浮菜单 -->
        <div v-if="activeCharacter === character.id" 
             class="floating-menu"
             :style="menuPosition">
          <div class="menu-arrow"></div>
          <button class="menu-btn edit" @click.stop="handleEdit(character)">
            <span class="btn-icon">✏️</span>
            <span class="btn-text">Edit</span>
          </button>
          <button class="menu-btn delete" @click.stop="handleDelete(character)">
            <span class="btn-icon">🗑️</span>
            <span class="btn-text">Delete</span>
          </button>
          <button class="menu-btn add-chat" @click.stop="addToChat(character)">
            <span class="btn-icon">💬</span>
            <span class="btn-text">Add to Chat</span>
          </button>
        </div>
      </li>
    </ul>
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
      const listItemRect = listItem.getBoundingClientRect()
      console.log(listItemRect)
      
      // 设置菜单位置，与列表项顶部对齐，并紧贴列表项右侧
      this.menuPosition = {
        top: '0',
        left: '100%'
      }
      
      this.activeCharacter = character.id
    },

    closeMenu() {
      this.activeCharacter = null
    },

    addToChat(character) {
      this.$emit('add-to-chat', character)
      this.closeMenu()
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
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.add-button {
  padding: 8px 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s ease;
}

.add-button:hover {
  background: #218838;
}

.list {
  list-style: none;
  padding: 0;
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
  display: flex;
  align-items: center;
  flex-grow: 1;
  cursor: pointer;
  padding-right: 10px;
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

.floating-menu {
  position: absolute;
  top: 0;
  left: calc(100% + 10px);
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1000;
  min-width: 150px;
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
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    width: auto;
    margin-top: 5px;
  }

  .menu-arrow {
    left: 20px;
    top: -6px;
  }

  .floating-menu::before {
    display: none;
  }
}
</style> 