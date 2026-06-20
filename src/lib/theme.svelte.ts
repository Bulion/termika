export type ThemePreference = 'system' | 'light' | 'dark';
export const THEME_STORAGE_KEY = 'termika-theme';

class ThemeController {
	preference = $state<ThemePreference>('system');
	systemDark = $state(false);
	resolved = $derived(
		this.preference === 'system' ? (this.systemDark ? 'dark' : 'light') : this.preference
	);

	init() {
		if (typeof window === 'undefined') return;
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored === 'light' || stored === 'dark' || stored === 'system') this.preference = stored;
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		this.systemDark = media.matches;
		media.addEventListener('change', (event) => {
			this.systemDark = event.matches;
			this.apply();
		});
		this.apply();
	}

	set(preference: ThemePreference) {
		this.preference = preference;
		if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_STORAGE_KEY, preference);
		this.apply();
	}

	private apply() {
		if (typeof document === 'undefined') return;
		if (this.resolved === 'dark') document.documentElement.dataset.theme = 'dark';
		else delete document.documentElement.dataset.theme;
	}
}

export const theme = new ThemeController();
