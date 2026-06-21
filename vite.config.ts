import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

const servedAtRoot = process.argv.includes('dev') || Boolean(process.env.VITEST);
const base: '' | `/${string}` = servedAtRoot
	? ''
	: ((process.env.BASE_PATH as `/${string}` | undefined) ?? '/licencjeLotnicze');

export default defineConfig({
	// convert-units is CommonJS and pulls in lodash, which expects a `global` binding.
	define: { global: 'globalThis' },
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: '404.html' }),
			paths: { base }
		}),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['localStorage', 'preferredLanguage', 'baseLocale']
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			kit: { base, adapterFallback: '404.html' },
			manifest: {
				name: 'Termika',
				short_name: 'Termika',
				description: 'Nauka teorii lotniczej / Aviation theory study',
				lang: 'pl',
				theme_color: '#4FB6E8',
				background_color: '#EAF6FF',
				display: 'standalone',
				orientation: 'any',
				icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,html,svg,png,jpg,jpeg,ico,webp,woff,woff2,json}']
			},
			devOptions: { enabled: false }
		})
	],
	test: {
		expect: { requireAssertions: true },
		passWithNoTests: true,
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright({ launchOptions: { args: ['--no-sandbox'] } }),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
