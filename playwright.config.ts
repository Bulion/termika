import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE = '/licencjeLotnicze';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	use: { baseURL: `http://localhost:${PORT}${BASE}/` },
	webServer: {
		command: 'npm run build && npm run preview -- --port ' + PORT,
		port: PORT,
		reuseExistingServer: !process.env.CI
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'mobile-portrait', use: { ...devices['Pixel 7'] } }
	]
});
