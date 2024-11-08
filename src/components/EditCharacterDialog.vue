<template>
  <div v-if="visible" class="dialog-overlay">
    <div class="dialog-content">
      <h2>{{ isNew ? 'Create Character' : 'Edit Character' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Name:</label>
          <input v-model="form.name" type="text" required class="input-field" />
        </div>
        
        <div class="form-group">
          <label>Description:</label>
          <textarea v-model="form.description" required class="description-textarea"></textarea>
        </div>

        <div class="form-group">
          <label>Type:</label>
          <select v-model="form.businessType" required class="input-field">
            <option value="question">提问者（擅长提问）</option>
            <option value="replay">回答者（擅长回答）</option>
          </select>
        </div>

        <div class="form-group">
          <label>Avatar:</label>
          <div class="avatar-upload">
            <img v-if="avatarPreview" :src="avatarPreview" class="avatar-preview" />
            <div class="upload-button-wrapper">
              <label for="avatar-upload" class="upload-button">
                <span class="upload-icon">📷</span>
                <span>Choose Image</span>
              </label>
              <input 
                id="avatar-upload"
                type="file" 
                @change="handleAvatarChange" 
                accept="image/*"
                class="file-input"
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Personality:</label>
          <textarea v-model="form.personality" required class="personality-textarea"></textarea>
        </div>

        <div class="form-group">
          <label>API Key:</label>
          <input v-model="form.apiKey" type="text" required class="input-field" />
        </div>

        <div class="form-group">
          <label>Engine Endpoint:</label>
          <input v-model="form.engineEndpoint" type="text" required class="input-field" />
        </div>

        <div class="form-group">
          <label>Model Name:</label>
          <input v-model="form.modelName" type="text" required class="input-field" />
        </div>

        <div class="form-group">
          <label>Response Format:</label>
          <textarea 
            v-model="responseFormatStr"
            class="code-textarea"
            @input="handleResponseFormatChange"
            placeholder="Enter JSON format"
            required
          ></textarea>
          <div v-if="responseFormatError" class="error-message">
            {{ responseFormatError }}
          </div>
        </div>

        <div class="dialog-actions">
          <button type="button" @click="testCharacter">测试人物</button>
          <button type="button" @click="$emit('close')">Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>

      <!-- 显示请求和返回的内容 -->
      <div v-if="responseContent" class="chat-box">
        <div class="chat-message user-message">
          <span>你:</span>
          <p>{{ requestMessage }}</p>
        </div>
        <div class="chat-message ai-message">
          <span>AI:</span>
          <p>{{ responseContent }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { API_ROUTES } from '../config/api.js'

export default {
  name: 'EditCharacterDialog',
  props: {
    visible: Boolean,
    character: {
      type: Object,
      default: () => ({})
    },
    isNew: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        name: '',
        description: '',
        personality: '',
        apiKey: '',
        engineEndpoint: '',
        modelName: '',
        avatar: null,
        businessType: 'replay',
        responseFormat: {
          rule: "$.choices[0].message.content",
          format: "json"
        }
      },
      responseFormatStr: '',
      responseFormatError: null,
      avatarPreview: null,
      responseContent: null,
      requestMessage: "哈喽你好啊，测试一下效果，你能给我回复一句话吗"
    }
  },
  watch: {
    character: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.form = { 
            ...newVal,
            businessType: newVal.businessType || 'replay',
            responseFormat: newVal.responseFormat || {
              rule: "$.choices[0].message.content",
              format: "json"
            }
          }
          this.responseFormatStr = JSON.stringify(this.form.responseFormat, null, 2)
          this.avatarPreview = newVal.avatar
        } else {
          // 重置为默认值
          this.responseFormatStr = JSON.stringify({
            rule: "$.choices[0].message.content",
            format: "json"
          }, null, 2)
        }
      }
    }
  },
  methods: {
    async handleAvatarChange(e) {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.avatarPreview = e.target.result
          this.form.avatar = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    handleResponseFormatChange(e) {
      try {
        const parsed = JSON.parse(e.target.value)
        this.form.responseFormat = parsed
        this.responseFormatError = null
      } catch (error) {
        this.responseFormatError = 'Invalid JSON format'
      }
    },
    handleSubmit() {
      if (this.responseFormatError) {
        alert('Please fix the Response Format JSON error before submitting')
        return
      }
      this.$emit('save', this.form)
    },
    async testCharacter() {
      const profileId = this.character.id; // 假设 profileId 是角色的 ID
      const message = { message: this.requestMessage };
      try {
        const response = await fetch(`${API_ROUTES.TEST_CHARACTER(profileId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });
        const data = await response.json();
        this.responseContent = data.content; // 提取返回内容中的 content
        console.log('Response from test character:', data);
      } catch (error) {
        console.error('Failed to test character:', error);
      }
    }
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.dialog-content {
  position: relative;
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.input-field,
.description-textarea,
.personality-textarea {
  width: calc(100% - 20px); /* 减去内边距 */
  padding: 10px; /* 增加内边距 */
  border: 1px solid #ddd;
  border-radius: 8px; /* 更圆的边角 */
  transition: border-color 0.3s; /* 添加过渡效果 */
}

.input-field:focus,
.description-textarea:focus,
.personality-textarea:focus {
  border-color: #007bff; /* 聚焦时的边框颜色 */
  outline: none; /* 去掉默认的轮廓 */
}

.description-textarea {
  height: 60px; /* 调整描述框的高度 */
}

.personality-textarea {
  height: 120px; /* 增加个性框的高度 */
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 3px solid #fff;
}

.upload-button-wrapper {
  position: relative;
  overflow: hidden;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(to bottom, #ffffff, #f7f7f7);
  border: 1px solid #dedede;
  border-radius: 6px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.upload-button:hover {
  background: linear-gradient(to bottom, #f7f7f7, #f0f0f0);
  border-color: #ccc;
}

.upload-button:active {
  background: linear-gradient(to bottom, #f0f0f0, #e8e8e8);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.upload-icon {
  font-size: 16px;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  opacity: 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.dialog-actions button {
  padding: 10px 16px; /* 增加按钮内边距 */
  border-radius: 8px; /* 更圆的边角 */
  cursor: pointer;
  transition: background-color 0.3s; /* 添加过渡效果 */
}

.dialog-actions button[type="submit"] {
  background: #007bff;
  color: white;
  border: none;
}

.dialog-actions button[type="button"] {
  background: #fff;
  border: 1px solid #ddd;
}

.dialog-actions button:hover {
  background-color: #f0f0f0; /* 悬停时的背景颜色 */
}

.chat-box {
  margin-top: 20px;
  border-top: 1px solid #ddd;
  padding-top: 10px;
}

.chat-message {
  margin-bottom: 10px;
}

.user-message {
  text-align: left;
}

.ai-message {
  text-align: left;
  color: #007bff; /* AI消息的颜色 */
}

.chat-message span {
  font-weight: bold;
}

.chat-message p {
  margin: 5px 0;
}

/* 添加 select 样式 */
select.input-field {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 1em;
  padding-right: 40px;
}

select.input-field:focus {
  border-color: #007bff;
  outline: none;
}

select.input-field option {
  padding: 10px;
}

.code-textarea {
  width: calc(100% - 20px);
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  min-height: 100px;
  background-color: #f8f9fa;
  color: #333;
  font-size: 14px;
  line-height: 1.5;
}

.code-textarea:focus {
  border-color: #007bff;
  outline: none;
  background-color: #fff;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}
</style> 