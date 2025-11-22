<template>
    <header class="ink-header">
        <div class="brand">
            <img class="brand-logo" src="/favicon.ico" alt="InKCre Logo" />
            <router-link to="/" class="brand-name" style="text-decoration: none"> InKCre </router-link>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style lang="scss" src="./inkHeader.scss" scoped></style>
