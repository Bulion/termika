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
const polar = (cx, cy, r, deg) => {
	const a = ((deg - 90) * Math.PI) / 180;
	return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
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

// Central density-altitude / true-airspeed window of the slide-rule side (a fixed card).
function densityWindow() {
	const cx = 260,
		cy = 410;
	const ink = '#2c2c22';
	const out = [];
	out.push(
		`<circle ${attrs({ cx, cy, r: 96, fill: '#f3f1e6', stroke: ink, 'stroke-width': 0.8 })} />`
	);
	out.push(
		`<circle ${attrs({ cx, cy, r: 96, fill: 'none', stroke: '#c9c6ba', 'stroke-width': 4 })} />`
	);

	// Air-temperature arc across the top.
	const rT = 82;
	out.push(txt(cx, cy - 92, 'AIR TEMPERATURE °C', { size: 6, fill: ink }));
	for (let t = -40; t <= 50; t += 5) {
		const ang = -68 + ((t + 40) / 90) * 136;
		const [x1, y1] = polar(cx, cy, rT, ang);
		const [x2, y2] = polar(cx, cy, rT - (t % 10 === 0 ? 6 : 3.5), ang);
		out.push(
			line({
				x1: round(x1),
				y1: round(y1),
				x2: round(x2),
				y2: round(y2),
				stroke: ink,
				'stroke-width': t % 10 === 0 ? 0.7 : 0.4
			})
		);
		if (t % 20 === 0) {
			const [lx, ly] = polar(cx, cy, rT + 7, ang);
			out.push(txt(lx, ly, String(t), { size: 5, fill: ink }));
		}
	}

	// Pressure-altitude window scale (thousands of feet).
	out.push(txt(cx, cy - 50, 'PRESSURE ALTITUDE', { size: 6, fill: ink }));
	out.push(txt(cx, cy - 42, 'THOUSANDS OF FEET', { size: 5, fill: '#6a6a5e' }));
	for (let k = 0; k <= 20; k += 2) {
		const x = cx - 50 + (k / 20) * 100;
		const big = k % 10 === 0;
		out.push(
			line({
				x1: round(x),
				y1: cy - 34,
				x2: round(x),
				y2: cy - 34 + (big ? 8 : 5),
				stroke: ink,
				'stroke-width': big ? 0.7 : 0.4
			})
		);
		if (big) out.push(txt(x, cy - 38, String(k), { size: 5, fill: ink }));
	}

	out.push(
		txt(cx, cy - 6, 'DENSITY ALTITUDE', { size: 8, fill: ink, extra: { 'font-weight': 'bold' } })
	);

	// Compact instruction blocks (as on the real card).
	out.push(
		txt(cx - 52, cy + 16, 'ALTITUDE: set air temp', { size: 4.5, fill: ink, anchor: 'start' })
	);
	out.push(
		txt(cx - 52, cy + 23, 'over pressure altitude', { size: 4.5, fill: '#6a6a5e', anchor: 'start' })
	);
	out.push(txt(cx + 52, cy + 16, 'TAS: read over the', { size: 4.5, fill: ink, anchor: 'end' }));
	out.push(
		txt(cx + 52, cy + 23, 'calibrated A.S. scale', { size: 4.5, fill: '#6a6a5e', anchor: 'end' })
	);
	out.push(
		txt(cx, cy + 44, 'FUEL · TIME · DISTANCE on the outer scales', { size: 4.5, fill: '#6a6a5e' })
	);
	return wrap(out);
}

writeFileSync(join(outDir, 'crosswind-grid.svg'), crosswindGrid());
writeFileSync(join(outDir, 'temperature-scale.svg'), temperatureScale());
writeFileSync(join(outDir, 'density-window.svg'), densityWindow());
console.log('Wrote crosswind-grid.svg, temperature-scale.svg and density-window.svg');
