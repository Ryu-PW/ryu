<template>
  <div class="walletconnect-container">
    <h3>{{ i18n.ts.connectWallet }}</h3>
    <appkit-button></appkit-button>
    <div v-if="loading" class="loading-indicator">{{ i18n.ts.loading }}</div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { walletLogin } from '@/account'; // Import updated walletLogin function
import { i18n } from '@/i18n.js';

const loading = ref(false);
const error = ref<string | null>(null);
</script>

<style scoped>

.loading-indicator {
  margin-top: 10px;
  color: #888;
}

.error-message {
  margin-top: 10px;
  color: red;
}
</style>
