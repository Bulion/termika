// Generates the static, non-interactive E6B front decorations as standalone SVG
// assets so they live as files instead of inline drawing code. Run: node scripts/gen-e6b-assets.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'e6b', 'assets');
const round = (n) => Number(n.toFixed(3));

function attrs(map) {
	return Object.entries(map)
		.filter(([, v]) => v !== undefined && v !== '')
		.map(([k, v]) => `${k}="${v}"`)
		.join(' ');
}
function txt(x, y, s, o = {}) {
	const a = {
		x: round(x),
		y: round(y),
		'text-anchor': o.anchor ?? 'middle',
		'dominant-baseline': o.base ?? 'middle',
		'font-size': o.size ?? 10,
		fill: o.fill ?? '#1a1a14',
		'font-family': 'Arial, sans-serif',
		transform: o.rot
	};
	return `<text ${attrs(a)}>${s}</text>`;
}
const line = (m) => `<line ${attrs(m)} />`;
const wrap = (children) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 760">\n${children.join('\n')}\n</svg>\n`;

function crosswindGrid() {
	const CWX = 40,
		CWY = 24,
		CWW = 200,
		CWH = 120;
	const ox = CWX + 10,
		oy = CWY + CWH - 12;
	const cwMaxKt = 50,
		cwR = CWH - 22;
	const out = [];
	out.push(
		`<rect ${attrs({ x: CWX, y: CWY, width: CWW, height: CWH, rx: 6, fill: '#e9e7dd', stroke: '#8a8a82' })} />`
	);
	out.push(txt(CWX + CWW / 2, CWY + 10, 'WIND COMPONENTS (kt)', { size: 7 }));
	for (let kt = 10; kt <= 50; kt += 10) {
		const r = (kt / cwMaxKt) * cwR;
		let d = `M ${round(ox + r)} ${round(oy)}`;
		for (let a = 0; a <= 90; a += 3) {
			const rad = (a * Math.PI) / 180;
			d += ` L ${round(ox + r * Math.cos(rad))} ${round(oy - r * Math.sin(rad))}`;
		}
		out.push(
			`<path ${attrs({ d, fill: 'none', stroke: '#9aa39a', 'stroke-width': kt % 50 === 0 ? 0.9 : 0.5 })} />`
		);
		out.push(txt(ox + r - 3, oy - 3, String(kt), { size: 6, fill: '#3a4339', anchor: 'end' }));
	}
	for (let a = 0; a <= 90; a += 15) {
		const rad = (a * Math.PI) / 180;
		out.push(
			line({
				x1: ox,
				y1: oy,
				x2: round(ox + cwR * Math.cos(rad)),
				y2: round(oy - cwR * Math.sin(rad)),
				stroke: '#9aa39a',
				'stroke-width': a % 90 === 0 ? 0.9 : 0.5
			})
		);
		const lr = cwR + 8;
		out.push(
			txt(ox + lr * Math.cos(rad), oy - lr * Math.sin(rad), `${a}°`, { size: 6, fill: '#3a4339' })
		);
	}
	out.push(txt(ox + cwR / 2, oy + 9, 'crosswind →', { size: 6, fill: '#3a4339' }));
	out.push(
		txt(ox - 6, oy - cwR / 2, 'head', {
			size: 6,
			fill: '#3a4339',
			anchor: 'end',
			rot: `rotate(-90 ${round(ox - 6)} ${round(oy - cwR / 2)})`
		})
	);
	return wrap(out);
}

function temperatureScale() {
	const TX = 40,
		TY = 648,
		TW = 440,
		TH = 60;
	const tCmin = -30,
		tCmax = 50;
	const tX = (c) => TX + 20 + ((c - tCmin) / (tCmax - tCmin)) * (TW - 40);
	const out = [];
	out.push(
		`<rect ${attrs({ x: TX, y: TY, width: TW, height: TH, rx: 6, fill: '#e9e7dd', stroke: '#8a8a82' })} />`
	);
	out.push(txt(TX + TW / 2, TY + 9, 'TEMPERATURE  °C (gora) / °F (dol)', { size: 8 }));
	for (let c = tCmin; c <= tCmax; c += 5) {
		const x = tX(c),
			big = c % 10 === 0;
		out.push(
			line({
				x1: round(x),
				y1: TY + 18,
				x2: round(x),
				y2: TY + 18 + (big ? 9 : 5),
				stroke: '#1a1a14',
				'stroke-width': big ? 0.9 : 0.5
			})
		);
		if (big) out.push(txt(x, TY + 15, String(c), { size: 6 }));
	}
	for (let f = -20; f <= 120; f += 10) {
		const c = ((f - 32) * 5) / 9;
		if (c < tCmin || c > tCmax) continue;
		const x = tX(c),
			big = f % 20 === 0;
		out.push(
			line({
				x1: round(x),
				y1: TY + TH - 18,
				x2: round(x),
				y2: TY + TH - 18 - (big ? 9 : 5),
				stroke: '#a8281c',
				'stroke-width': big ? 0.9 : 0.5
			})
		);
		if (big) out.push(txt(x, TY + TH - 9, String(f), { size: 6, fill: '#a8281c' }));
	}
	out.push(
		line({
			x1: round(tX(tCmin)),
			y1: TY + 30,
			x2: round(tX(tCmax)),
			y2: TY + 30,
			stroke: '#c9c6ba',
			'stroke-width': 0.6
		})
	);
	return wrap(out);
}

writeFileSync(join(outDir, 'crosswind-grid.svg'), crosswindGrid());
writeFileSync(join(outDir, 'temperature-scale.svg'), temperatureScale());
console.log('Wrote crosswind-grid.svg and temperature-scale.svg');
