import { env } from '$env/dynamic/public';

/**
 * Absolute site origin used for canonical links, sitemap and social images.
 * Set `PUBLIC_SITE_URL` (e.g. https://uzytkownik.github.io) at build time for production;
 * when empty, the {@link Seo} component falls back to the live `window` origin at runtime.
 */
export const SITE_URL = (env.PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

/** Routes that are real, indexable pages (used to generate the sitemap). */
export const SITEMAP_ROUTES = ['', 'study', 'drills', 'exam', 'dashboard'];
