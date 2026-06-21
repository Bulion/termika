import { base } from '$app/paths';
import { SITE_URL } from '$lib/seo';

export const prerender = true;

export function GET() {
	const lines = ['User-agent: *', 'Allow: /'];
	if (SITE_URL) lines.push('', `Sitemap: ${SITE_URL}${base}/sitemap.xml`);
	return new Response(lines.join('\n') + '\n', {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
}
