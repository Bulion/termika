import { chromium } from 'playwright';

const BASE = 'http://localhost:4321/termika';
const routes = ['/', '/study', '/drills', '/exam', '/dashboard'];
const schemes = ['light', 'dark'];

const detector = () => {
	const out = [];
	const els = Array.from(document.querySelectorAll('body *'));
	for (const el of els) {
		// own (non-child) visible text
		const ownText = Array.from(el.childNodes)
			.filter((n) => n.nodeType === 3)
			.map((n) => n.textContent.trim())
			.join('');
		if (ownText.length < 2) continue;
		const style = getComputedStyle(el);
		if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0)
			continue;
		const r = el.getBoundingClientRect();
		if (r.width < 4 || r.height < 4) continue;
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) continue;
		const top = document.elementFromPoint(cx, cy);
		if (!top) continue;
		if (el.contains(top) || top.contains(el)) continue;
		out.push({
			text: ownText.slice(0, 40),
			tag:
				el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
			coveredBy:
				top.tagName.toLowerCase() + (top.className ? '.' + String(top.className).split(' ')[0] : '')
		});
	}
	return out;
};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
let total = 0;
for (const scheme of schemes) {
	for (const route of routes) {
		const page = await browser.newPage({
			colorScheme: scheme,
			viewport: { width: 1280, height: 900 }
		});
		await page.goto(BASE + route, { waitUntil: 'networkidle' });
		await page.waitForTimeout(1200);
		const findings = await page.evaluate(detector);
		if (findings.length) {
			total += findings.length;
			console.log(`\n[${scheme}] ${route} - ${findings.length} occlusion(s):`);
			for (const f of findings) console.log(`  "${f.text}" (${f.tag}) covered by ${f.coveredBy}`);
		}
		await page.close();
	}
}
console.log(`\nTOTAL occlusions: ${total}`);
await browser.close();
