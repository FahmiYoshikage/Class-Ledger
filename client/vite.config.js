import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                // Skip waiting and claim clients immediately on update
                skipWaiting: true,
                clientsClaim: true,
                // Clean up old caches
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        // API requests - Network First strategy
                        urlPattern: ({ url }) => {
                            return url.pathname.startsWith('/api/');
                        },
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 5, // 5 minutes only
                            },
                            networkTimeoutSeconds: 10,
                        },
                    },
                    {
                        // Static assets - Cache First with fallback
                        urlPattern: ({ request }) => {
                            return (
                                request.destination === 'style' ||
                                request.destination === 'script' ||
                                request.destination === 'image'
                            );
                        },
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'static-resources',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                            },
                        },
                    },
                ],
            },
            includeAssets: [
                'favicon.ico',
                'apple-touch-icon.png',
                'mask-icon.svg',
            ],
            manifest: {
                name: 'Kas Kelas - Sistem Pencatatan Kas',
                short_name: 'Kas Kelas',
                description:
                    'Sistem Pencatatan Kas Kelas TRIFORCE Rp 2.000/minggu',
                theme_color: '#4F46E5',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                orientation: 'portrait',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            devOptions: {
                enabled: false,
                type: 'module',
            },
        }),
    ],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8012',
                changeOrigin: true,
            },
        },
    },
});
