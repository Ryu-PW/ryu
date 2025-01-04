<template>
    <div v-if="showing" :class="$style.popup" @click="close">
        <div :class="$style.message">{{ message }}</div>
    </div>
</template>

<script lang="ts">
import { defineProps, defineEmits } from 'vue';

export default {
    props: {
        showing: Boolean,
        message: String,
    },
    emits: ['close'],
    methods: {
        close() {
            this.$emit('close');
        },
    },
};
</script>

<style lang="scss" module>
.popup {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--MI_THEME-popupBg);
    color: var(--MI_THEME-popupFg);
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    animation: fade-in 0.3s;
}

.message {
    font-size: 1rem;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
