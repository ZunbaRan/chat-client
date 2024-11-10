<template>
  <div class="sidebar">
    <div class="list-header">
      <span>Characters List</span>
      <div v-if="batchSelectMode" class="batch-select-actions">
        <label class="select-all-label">
          <input 
            type="checkbox" 
            :checked="isAllSelected"
            @change="toggleSelectAll"
          >
          全选
        </label>
        <div class="action-buttons">
          <button class="confirm-button" @click="confirmBatchAdd">确定</button>
          <button class="cancel-button" @click="cancelBatchSelect">取消</button>
        </div>
      </div>
      <button v-else class="add-button" @click="$emit('show-dialog', {})">
        <i class="fas fa-plus"></i> Add New
      </button>
    </div>
    <div class="characters-container">
      <ul class="list characters-list">
        <li v-for="character in characters" 
            :key="character.id" 
            class="list-item"
            :class="{ 'batch-select-mode': batchSelectMode }"
            @click="handleItemClick(character, $event)">
          <input 
            v-if="batchSelectMode"
            type="checkbox"
            :checked="selectedCharacters.includes(character.id)"
            @click.stop
            @change="toggleSelect(character)"
            class="batch-select-checkbox"
          >
          <div class="character-info">
            <div class="avatar" v-if="character.avatar">
              <img :src="character.avatar" alt="avatar">
            </div>
            <div class="avatar" v-else>
              {{ getInitials(character.name) }}
            </div>
            <span class="name">{{ character.name }}</span>
            <span class="ai-type-badge" :class="character.businessType">
              {{ getTypeBadgeText(character.businessType) }}
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
              <button class="menu-btn copy" @click.stop="handleCopy(getActiveCharacter())">
                <span class="btn-icon">📋</span>
                <span class="btn-text">Copy</span>
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
  props: {
    currentSessionId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      characters: [],
      activeCharacter: null,
      menuPosition: {
        top: '0px',
        left: '0px'
      },
      batchSelectMode: false,
      selectedCharacters: []
    }
  },
  mounted() {
    // 点击其他区域关闭菜单
    document.addEventListener('click', this.closeMenu)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeMenu)
  },
  computed: {
    isAllSelected() {
      return this.characters.length > 0 && 
             this.selectedCharacters.length === this.characters.length
    }
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
      if (this.batchSelectMode) {
        this.toggleSelect(character)
        return
      }
      event.stopPropagation()
      
      // 如果点击的是同一个角色，则关闭菜单
      if (this.activeCharacter === character.id) {
        this.activeCharacter = null
        return
      }

      // 获取列表项的位置信息
      const listItem = event.currentTarget
      const rect = listItem.getBoundingClientRect()
      
      // 设菜单位置
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
    },

    getTypeBadgeText(type) {
      switch (type) {
        case 'question':
          return 'Q'
        case 'replay':
          return 'A'
        case 'content_creator':
          return 'C'
        default:
          return 'A'
      }
    },

    handleCopy(character) {
      // 创建一个新的角色对象，移除 id 属性
      const copiedCharacter = {
        ...character,
        name: `${character.name} (Copy)`, // 在名称后添加 (Copy) 标识
        id: undefined // 移除 id，这样会被视为新角色
      }
      
      // 触发显示编辑弹窗事件，传递复制的角色数据
      this.$emit('show-dialog', copiedCharacter)
      this.closeMenu()
    },

    enterBatchSelectMode() {
      this.batchSelectMode = true
      this.selectedCharacters = []
    },

    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedCharacters = this.characters.map(char => char.id)
      } else {
        this.selectedCharacters = []
      }
    },

    toggleSelect(character) {
      const index = this.selectedCharacters.indexOf(character.id)
      if (index === -1) {
        this.selectedCharacters.push(character.id)
      } else {
        this.selectedCharacters.splice(index, 1)
      }
    },

    async confirmBatchAdd() {
      if (this.selectedCharacters.length === 0) {
        alert('请至少选择一个角色')
        return
      }

      try {
        const response = await fetch(
          API_ROUTES.ADD_AI_TO_SESSION(this.currentSessionId),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              aiProfileIds: this.selectedCharacters
            })
          }
        )

        const data = await response.json()
        if (data.code === 200) {
          this.$parent.showToast('已添加所选角色到聊天')
          this.$parent.$refs.chatArea.fetchChatSession()
          this.cancelBatchSelect()
        } else {
          throw new Error(data.message || '添加失败')
        }
      } catch (error) {
        this.$parent.showToast(error.message || '添加失败', 'error')
      }
    },

    cancelBatchSelect() {
      this.batchSelectMode = false
      this.selectedCharacters = []
    }
  },
  created() {
    this.fetchCharacters()
  }
}
</script>

<style scoped>
.sidebar {
  width: 290px;
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

.ai-type-badge.content_creator {
  background-color: #fd7e14;
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

.menu-btn.copy:hover {
  background-color: #e3f2fd;
  color: #0056b3;
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

  .menu-btn {
    padding: 10px 12px; /* 在移动端增加按钮的可点击区域 */
  }
}

.batch-select-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.confirm-button,
.cancel-button {
  padding: 4px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.confirm-button {
  background: #007bff;
  color: white;
}

.cancel-button {
  background: #6c757d;
  color: white;
}

.batch-select-checkbox {
  margin-right: 10px;
}

.list-item.batch-select-mode {
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.batch-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
</style> 