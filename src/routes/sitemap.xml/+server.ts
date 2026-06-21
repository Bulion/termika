import { base } from '$app/paths';
import { SITE_URL, SITEMAP_ROUTES } from '$lib/seo';

export const prerender = true;

export function GET() {
	const loc = (route: string) => `${SITE_URL}${base}/${route}`.replace(/\/$/, '') || `${SITE_URL}/`;
	const urls = SITEMAP_ROUTES.map((r) => `\t<url><loc>${loc(r)}</loc></url>`).join('\n');
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
