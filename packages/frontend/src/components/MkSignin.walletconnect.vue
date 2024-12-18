<!-- MkSignin.walletconnect.vue -->
<template>
  <div :class="$style.walletConnectRoot">
    <button :class="$style.walletConnectButton" @click="onWalletConnect">
      Login with WalletConnect
    </button>
  </div>
</template>

<script setup lang="ts">
import { walletLogin } from '@/account'; // Import the walletLogin function

async function onWalletConnect() {
  try {
    await walletLogin(); // Trigger WalletConnect login
  } catch (error) {
    console.error('WalletConnect login error:', error);
  }
}
</script>

<style lang="scss" module>
.walletConnectRoot {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.walletConnectButton {
  background-color: var(--MI_THEME-button-primary-bg);
  color: var(--MI_THEME-button-primary-text);
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--MI_THEME-button-primary-hover-bg);
  }
}
</style>
