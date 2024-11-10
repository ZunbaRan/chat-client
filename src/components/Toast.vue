<template>
  <transition name="toast">
    <div v-if="visible" 
         class="toast-container" 
         :class="type">
      <div class="toast-content">
        <span class="toast-icon">
          {{ type === 'success' ? '✓' : '✕' }}
        </span>
        <span class="toast-message">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ToastComponent',
  props: {
    visible: Boolean,
    message: String,
    type: {
      type: String,
      default: 'success',
      validator: value => ['success', 'error'].includes(value)
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  min-width: 200px;
  display: flex;
  justify-content: center;
}

.success {
  background-color: rgba(40, 167, 69, 0.95);
  color: white;
}

.error {
  background-color: rgba(220, 53, 69, 0.95);
  color: white;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-icon {
  font-size: 16px;
  font-weight: bold;
}

.toast-message {
  font-size: 14px;
  font-weight: 500;
}

/* 动画效果 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style> 