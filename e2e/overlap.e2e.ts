import { expect, test } from '@playwright/test';

const routes = [
	'./',
	'./study',
	'./study/session?mode=all',
	'./study/session?mode=scenario',
	'./drills',
	'./drills/run?set=nav-rules',
	'./drills/run?set=magnetic-headings',
	'./drills/run?set=e6b-wind',
	'./drills/run?set=performance',
	'./drills/quiz?set=phonetic-alphabet',
	'./drills/quiz?set=abbreviations',
	'./drills/quiz?set=metar-codes',
	'./exam',
	'./dashboard'
];

interface Occlusion {
	text: string;
	element: string;
	coveredBy: string;
}

/**
 * Finds text-bearing elements whose centre point is painted over by an unrelated element.
 * The hidden back face of a flip card legitimately sits behind its front, so it is ignored.
 */
function findOcclusions(): Occlusion[] {
	const out: Occlusion[] = [];
	for (const el of Array.from(document.querySelectorAll('body *'))) {
		const ownText = Array.from(el.childNodes)
			.filter((n) => n.nodeType === Node.TEXT_NODE)
			.map((n) => (n.textContent ?? '').trim())
			.join('');
		if (ownText.length < 2) continue;

		const style = getComputedStyle(el);
		if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0)
			continue;

		const rect = el.getBoundingClientRect();
		if (rect.width < 4 || rect.height < 4) continue;
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) continue;

		const top = document.elementFromPoint(cx, cy);
		if (!top || el.contains(top) || top.contains(el)) continue;
		if (el.closest('.face--back') || top.closest('.face--back')) continue;
		// The E6B instrument is a deliberately dense SVG and the launcher floats over content.
		if (el.closest('.e6b-root') || top.closest('.e6b-root')) continue;
		if (el.closest('.fab') || top.closest('.fab')) continue;

		out.push({
			text: ownText.slice(0, 50),
			element: el.getAttribute('class') ?? el.tagName,
			coveredBy: top.getAttribute('class') ?? top.tagName
		});
	}
	return out;
}

for (const route of routes) {
	test(`no overlapping text on ${route}`, async ({ page }) => {
		await page.goto(route);
		await page.waitForTimeout(1200);
		const occlusions = await page.evaluate(findOcclusions);
		expect(occlusions, JSON.stringify(occlusions, null, 2)).toEqual([]);
	});
}
