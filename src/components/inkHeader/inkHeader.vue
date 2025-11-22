<template>
    <header class="ink-header" :class="{
        'ink-header--default': mode === 'default',
        'ink-header--page': mode === 'page',
        'ink-header--section': mode === 'section'
    }">
        <!-- Default Brand Mode -->
        <div v-if="mode === 'default'" class="brand">
            <img class="brand-logo" src="/favicon.ico" alt="InKCre Logo" />
            <router-link to="/" class="brand-name" style="text-decoration: none"> InKCre </router-link>
        </div>

        <!-- Page Header Mode -->
        <template v-else-if="mode === 'page'">
            <h1 v-if="title" class="ink-header__title">{{ title }}</h1>
            <nav v-if="navLinks && navLinks.length > 0" class="ink-header__nav">
                <template v-for="link in navLinks" :key="link.to">
                    <router-link v-if="!link.external" :to="link.to" class="ink-header__nav-link">
                        {{ link.label }}
                    </router-link>
                    <a v-else :href="link.to" class="ink-header__nav-link" target="_blank" rel="noopener noreferrer">
                        {{ link.label }}
                    </a>
                </template>
            </nav>
        </template>

        <!-- Section Header Mode -->
        <h1 v-else-if="mode === 'section'" class="ink-header__section-title">{{ title }}</h1>
    </header>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'
import type { InkHeaderProps } from './inkHeader'

const props = withDefaults(defineProps<InkHeaderProps>(), {
    mode: 'default',
    title: '',
    navLinks: () => []
})
</script>

<style lang="scss" src="./inkHeader.scss" scoped></style>
