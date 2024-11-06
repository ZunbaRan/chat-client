<template>
  <div v-if="visible" class="dialog-overlay">
    <div class="dialog-content">
      <h2>{{ isNew ? 'Create Character' : 'Edit Character' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Name:</label>
          <input v-model="form.name" type="text" required>
        </div>
        
        <div class="form-group">
          <label>Description:</label>
          <textarea v-model="form.description" required></textarea>
        </div>

        <div class="form-group">
          <label>Avatar:</label>
          <div class="avatar-upload">
            <img v-if="avatarPreview" :src="avatarPreview" class="avatar-preview">
            <input type="file" @change="handleAvatarChange" accept="image/*">
          </div>
        </div>

        <div class="form-group">
          <label>Personality:</label>
          <textarea v-model="form.personality" required></textarea>
        </div>

        <div class="form-group">
          <label>API Key:</label>
          <input v-model="form.apiKey" type="text" required>
        </div>

        <div class="form-group">
          <label>Engine Endpoint:</label>
          <input v-model="form.engineEndpoint" type="text" required>
        </div>

        <div class="form-group">
          <label>Request Format:</label>
          <textarea 
            v-model="requestFormatStr" 
            @input="handleRequestFormatChange"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label>Response Format:</label>
          <textarea 
            v-model="responseFormatStr"
            @input="handleResponseFormatChange" 
            required
          ></textarea>
        </div>

        <div class="dialog-actions">
          <button type="button" @click="$emit('close')">Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
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
        requestFormat: {},
        responseFormat: {},
        avatar: null
      },
      avatarPreview: null,
      requestFormatStr: '',
      responseFormatStr: ''
    }
  },
  watch: {
    character: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.form = { ...newVal }
          this.requestFormatStr = JSON.stringify(newVal.requestFormat, null, 2)
          this.responseFormatStr = JSON.stringify(newVal.responseFormat, null, 2)
          this.avatarPreview = newVal.avatar
        }
      }
    }
  },
  methods: {
    handleRequestFormatChange(e) {
      try {
        this.form.requestFormat = JSON.parse(e.target.value)
      } catch (error) {
        console.error('Invalid JSON format')
      }
    },
    handleResponseFormatChange(e) {
      try {
        this.form.responseFormat = JSON.parse(e.target.value)
      } catch (error) {
        console.error('Invalid JSON format')
      }
    },
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
    handleSubmit() {
      this.$emit('save', this.form)
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
  z-index: 1000;
}

.dialog-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group textarea {
  height: 100px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.dialog-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
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
</style> 