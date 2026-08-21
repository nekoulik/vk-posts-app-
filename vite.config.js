import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/vk-posts-app-/',
    resolve: {
        alias: {
            './lib/polyfills': './lib/polyfills/polyfills.mjs'
        }
    },
    optimizeDeps: {
        include: ['@vkontakte/vkui', '@vkontakte/vk-bridge']
    }
})