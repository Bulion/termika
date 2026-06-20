import { E6B_STRINGS, type E6bLocale } from './strings';

const NS = 'http://www.w3.org/2000/svg';
const PXPERKT = 2.0;
const B_CX = 260;
const B_CY = 430;
const B_R = 205;

type Attrs = Record<string, string | number>;
interface TextOpts {
	anchor?: string;
	base?: string;
	size?: number;
	fill?: string;
	rot?: string;
	extra?: Attrs;
}

function el(tag: string, attrs: Attrs = {}): SVGElement {
	const node = document.createElementNS(NS, tag) as SVGElement;
	for (const key in attrs) node.setAttribute(key, String(attrs[key]));
	return node;
}

function txt(x: number, y: number, value: string, opts: TextOpts = {}): SVGElement {
	const node = el('text', {
		x,
		y,
		'text-anchor': opts.anchor ?? 'middle',
		'dominant-baseline': opts.base ?? 'middle',
		'font-size': opts.size ?? 10,
		fill: opts.fill ?? '#1a1a14',
		'font-family': 'Arial, sans-serif',
		transform: opts.rot ?? '',
		...(opts.extra ?? {})
	});
	node.textContent = value;
	return node;
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
	const a = ((deg - 90) * Math.PI) / 180;
	return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function logAngle(v: number): number {
	let m = v;
	while (m >= 100) m /= 10;
	while (m < 10) m *= 10;
	return (Math.log10(m) - 1) * 360;
}

function buildLogScale(
	cx: number,
	cy: number,
	rTick: number,
	rLabel: number,
	tickIn: boolean,
	labeled: boolean
): SVGElement {
	const g = el('g');
	const majors = [10, 11, 12, 13, 14, 15, 16, 18, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90];
	const dec = (b: number): number[] => {
		const out: number[] = [];
		(
			[
				[1, 2, 0.05],
				[2, 5, 0.1],
				[5, 10, 0.2]
			] as const
		).forEach(([a, bb, st]) => {
			for (let v = a; v < bb - 1e-9; v += st) out.push(+(b * v).toFixed(4));
		});
		return out;
	};
	const ticks = Array.from(
		new Set(
			dec(10)
				.concat(dec(100))
				.filter((v) => v >= 10 && v < 100)
				.map((v) => +v.toFixed(3))
		)
	);
	ticks.forEach((v) => {
		const ang = logAngle(v);
		const big = majors.indexOf(v) >= 0;
		const len = big ? 9 : Math.abs(v - Math.round(v)) < 1e-6 ? 6 : 3.5;
		const p1 = polar(cx, cy, rTick, ang);
		const p2 = polar(cx, cy, rTick + (tickIn ? -len : len), ang);
		g.appendChild(
			el('line', {
				x1: p1[0],
				y1: p1[1],
				x2: p2[0],
				y2: p2[1],
				stroke: '#1a1a14',
				'stroke-width': big ? 1.1 : 0.6
			})
		);
	});
	if (labeled)
		majors.forEach((v) => {
			const ang = logAngle(v);
			const pr = polar(cx, cy, rLabel, ang);
			g.appendChild(
				txt(pr[0], pr[1], String(v), { size: 11, rot: `rotate(${ang} ${pr[0]} ${pr[1]})` })
			);
		});
	return g;
}

function buildHourScale(cx: number, cy: number, rTick: number, rLabel: number): SVGElement {
	const g = el('g');
	const marks: [number, string][] = [
		[60, '1:00'],
		[70, '1:10'],
		[80, '1:20'],
		[90, '1:30'],
		[100, '1:40'],
		[120, '2:00'],
		[150, '2:30'],
		[180, '3:00'],
		[240, '4:00'],
		[300, '5:00'],
		[360, '6:00'],
		[420, '7:00'],
		[480, '8:00'],
		[540, '9:00']
	];
	marks.forEach(([mins, label]) => {
		const ang = logAngle(mins / 6);
		const pr = polar(cx, cy, rLabel, ang);
		g.appendChild(
			txt(pr[0], pr[1], label, {
				size: 8,
				fill: '#1a4a7a',
				rot: `rotate(${ang} ${pr[0]} ${pr[1]})`
			})
		);
		const t1 = polar(cx, cy, rTick, ang);
		const t2 = polar(cx, cy, rTick - 6, ang);
		g.appendChild(
			el('line', {
				x1: t1[0],
				y1: t1[1],
				x2: t2[0],
				y2: t2[1],
				stroke: '#1a4a7a',
				'stroke-width': 0.8
			})
		);
	});
	return g;
}

interface FrontRefs {
	svg: SVGElement;
	disc: SVGElement;
	cursor: SVGElement;
	cwMark: SVGElement;
	tMark: SVGElement;
	cx: number;
	cy: number;
	cw: { ox: number; oy: number; R: number; maxKt: number };
	temp: { tX: (c: number) => number; cmin: number; cmax: number; X: number; W: number };
}

function buildFront(strings: typeof E6B_STRINGS.pl): FrontRefs {
	const svg = el('svg', { viewBox: '0 0 520 760' });
	svg.appendChild(
		el('rect', {
			x: 0,
			y: 0,
			width: 520,
			height: 760,
			rx: 22,
			fill: '#cfcfca',
			stroke: '#9a9a93',
			'stroke-width': 2
		})
	);
	const CWX = 40,
		CWY = 24,
		CWW = 200,
		CWH = 120;
	const ox = CWX + 10,
		oy = CWY + CWH - 12;
	const cwMaxKt = 50,
		cwR = CWH - 22;
	svg.appendChild(
		el('rect', {
			x: CWX,
			y: CWY,
			width: CWW,
			height: CWH,
			rx: 6,
			fill: '#e9e7dd',
			stroke: '#8a8a82'
		})
	);
	svg.appendChild(
		txt(CWX + CWW / 2, CWY + 10, 'WIND COMPONENTS (kt)', { size: 7, fill: '#1a1a14' })
	);
	for (let kt = 10; kt <= 50; kt += 10) {
		const r = (kt / cwMaxKt) * cwR;
		let dpath = `M ${ox + r} ${oy}`;
		for (let a = 0; a <= 90; a += 3) {
			const rad = (a * Math.PI) / 180;
			dpath += ` L ${ox + r * Math.cos(rad)} ${oy - r * Math.sin(rad)}`;
		}
		svg.appendChild(
			el('path', {
				d: dpath,
				fill: 'none',
				stroke: '#9aa39a',
				'stroke-width': kt % 50 === 0 ? 0.9 : 0.5
			})
		);
		svg.appendChild(
			txt(ox + r - 3, oy - 3, String(kt), { size: 6, fill: '#3a4339', anchor: 'end' })
		);
	}
	for (let a = 0; a <= 90; a += 15) {
		const rad = (a * Math.PI) / 180;
		svg.appendChild(
			el('line', {
				x1: ox,
				y1: oy,
				x2: ox + cwR * Math.cos(rad),
				y2: oy - cwR * Math.sin(rad),
				stroke: '#9aa39a',
				'stroke-width': a % 90 === 0 ? 0.9 : 0.5
			})
		);
		const lr = cwR + 8;
		svg.appendChild(
			txt(ox + lr * Math.cos(rad), oy - lr * Math.sin(rad), `${a}°`, { size: 6, fill: '#3a4339' })
		);
	}
	svg.appendChild(txt(ox + cwR / 2, oy + 9, 'crosswind →', { size: 6, fill: '#3a4339' }));
	svg.appendChild(
		txt(ox - 6, oy - cwR / 2, 'head', {
			size: 6,
			fill: '#3a4339',
			anchor: 'end',
			rot: `rotate(-90 ${ox - 6} ${oy - cwR / 2})`
		})
	);
	const cwMark = el('g', { class: 'e6b-grab' });
	cwMark.appendChild(
		el('circle', { cx: 0, cy: 0, r: 7, fill: 'none', stroke: '#a8281c', 'stroke-width': 2 })
	);
	cwMark.appendChild(el('circle', { cx: 0, cy: 0, r: 2, fill: '#a8281c' }));
	svg.appendChild(cwMark);

	svg.appendChild(
		txt(380, 38, 'FLIGHT COMPUTER', {
			size: 12,
			extra: { 'font-weight': 'bold', 'letter-spacing': '1.5' }
		})
	);
	const cx = 260,
		cy = 410,
		Rr = 232;
	svg.appendChild(el('circle', { cx, cy, r: Rr, fill: '#16160f' }));
	svg.appendChild(
		el('circle', { cx, cy, r: Rr - 2, fill: 'none', stroke: '#efece2', 'stroke-width': 40 })
	);
	// Lighten the inner gap ring so the red conversion indices read clearly.
	svg.appendChild(
		el('circle', { cx, cy, r: Rr - 33, fill: 'none', stroke: '#3b3b32', 'stroke-width': 22 })
	);
	svg.appendChild(buildLogScale(cx, cy, Rr - 22, Rr - 12, false, true));
	(
		[
			['NAUT', 66],
			['STAT', 76],
			['KM', 12.2]
		] as const
	).forEach(([label, v]) => {
		const ang = logAngle(v);
		const pr = polar(cx, cy, Rr - 33, ang);
		svg.appendChild(
			txt(pr[0], pr[1], label, {
				size: 8,
				fill: '#ff9a7d',
				extra: { 'font-weight': 'bold' },
				rot: `rotate(${ang} ${pr[0]} ${pr[1]})`
			})
		);
	});

	const disc = el('g', { class: 'e6b-grab' });
	disc.appendChild(
		el('circle', { cx, cy, r: Rr - 44, fill: '#efece2', stroke: '#1a1a14', 'stroke-width': 1 })
	);
	disc.appendChild(buildLogScale(cx, cy, Rr - 50, Rr - 62, true, true));
	disc.appendChild(buildHourScale(cx, cy, Rr - 78, Rr - 90));
	disc.appendChild(
		el('circle', { cx, cy, r: Rr - 128, fill: 'none', stroke: '#c9c6ba', 'stroke-width': 1 })
	);
	const rA = logAngle(60),
		rp = polar(cx, cy, Rr - 44, rA);
	disc.appendChild(
		el('polygon', {
			points: `${rp[0]},${rp[1]} ${rp[0] - 7},${rp[1] + 15} ${rp[0] + 7},${rp[1] + 15}`,
			fill: '#a8281c',
			transform: `rotate(${rA} ${rp[0]} ${rp[1]})`
		})
	);
	const rtp = polar(cx, cy, Rr - 66, rA);
	disc.appendChild(
		txt(rtp[0], rtp[1], 'RATE 60', {
			size: 7,
			fill: '#a8281c',
			rot: `rotate(${rA} ${rtp[0]} ${rtp[1]})`
		})
	);
	disc.appendChild(
		el('circle', { cx, cy, r: 14, fill: '#cfcfca', stroke: '#1a1a14', 'stroke-width': 1.5 })
	);
	disc.appendChild(el('circle', { cx, cy, r: 3, fill: '#1a1a14' }));
	svg.appendChild(disc);

	const cursor = el('g', { class: 'e6b-grab' });
	cursor.appendChild(
		el('line', {
			x1: cx,
			y1: cy - Rr + 4,
			x2: cx,
			y2: cy - Rr + 44,
			stroke: '#1d6fb0',
			'stroke-width': 1.6
		})
	);
	cursor.appendChild(
		el('polygon', {
			points: `${cx},${cy - Rr + 2} ${cx - 5},${cy - Rr - 8} ${cx + 5},${cy - Rr - 8}`,
			fill: '#1d6fb0'
		})
	);
	svg.appendChild(cursor);

	const TX = 40,
		TY = 648,
		TW = 440,
		TH = 60;
	const tCmin = -30,
		tCmax = 50;
	const tX = (c: number): number => TX + 20 + ((c - tCmin) / (tCmax - tCmin)) * (TW - 40);
	svg.appendChild(
		el('rect', { x: TX, y: TY, width: TW, height: TH, rx: 6, fill: '#e9e7dd', stroke: '#8a8a82' })
	);
	svg.appendChild(
		txt(TX + TW / 2, TY + 9, 'TEMPERATURE  °C (gora) / °F (dol)', { size: 8, fill: '#1a1a14' })
	);
	for (let c = tCmin; c <= tCmax; c += 5) {
		const x = tX(c),
			big = c % 10 === 0;
		svg.appendChild(
			el('line', {
				x1: x,
				y1: TY + 18,
				x2: x,
				y2: TY + 18 + (big ? 9 : 5),
				stroke: '#1a1a14',
				'stroke-width': big ? 0.9 : 0.5
			})
		);
		if (big) svg.appendChild(txt(x, TY + 15, String(c), { size: 6, fill: '#1a1a14' }));
	}
	for (let f = -20; f <= 120; f += 10) {
		const c = ((f - 32) * 5) / 9;
		if (c < tCmin || c > tCmax) continue;
		const x = tX(c),
			big = f % 20 === 0;
		svg.appendChild(
			el('line', {
				x1: x,
				y1: TY + TH - 18,
				x2: x,
				y2: TY + TH - 18 - (big ? 9 : 5),
				stroke: '#a8281c',
				'stroke-width': big ? 0.9 : 0.5
			})
		);
		if (big) svg.appendChild(txt(x, TY + TH - 9, String(f), { size: 6, fill: '#a8281c' }));
	}
	svg.appendChild(
		el('line', {
			x1: tX(tCmin),
			y1: TY + 30,
			x2: tX(tCmax),
			y2: TY + 30,
			stroke: '#c9c6ba',
			'stroke-width': 0.6
		})
	);
	const tMark = el('g', { class: 'e6b-grab' });
	tMark.appendChild(
		el('line', {
			x1: 0,
			y1: TY + 16,
			x2: 0,
			y2: TY + TH - 16,
			stroke: '#1d6fb0',
			'stroke-width': 1.6
		})
	);
	tMark.appendChild(
		el('polygon', { points: `0,${TY + 14} -5,${TY + 6} 5,${TY + 6}`, fill: '#1d6fb0' })
	);
	svg.appendChild(tMark);

	void strings;
	return {
		svg,
		disc,
		cursor,
		cwMark,
		tMark,
		cx,
		cy,
		cw: { ox, oy, R: cwR, maxKt: cwMaxKt },
		temp: { tX, cmin: tCmin, cmax: tCmax, X: TX, W: TW }
	};
}

interface BackRefs {
	svg: SVGElement;
	ringGroup: SVGElement;
	dotGroup: SVGElement;
	slideGroup: SVGElement;
	ring: SVGElement;
	grid: SVGElement;
	dot: SVGElement;
	tasCircle: SVGElement;
}

function buildBack(strings: typeof E6B_STRINGS.pl): BackRefs {
	const svg = el('svg', { viewBox: '0 0 520 760' });
	svg.appendChild(
		el('rect', {
			x: 0,
			y: 0,
			width: 520,
			height: 760,
			rx: 22,
			fill: '#16160f',
			stroke: '#000',
			'stroke-width': 2
		})
	);
	svg.appendChild(
		el('rect', {
			x: 60,
			y: 20,
			width: 400,
			height: 70,
			rx: 5,
			fill: 'none',
			stroke: '#efece2',
			'stroke-width': 1
		})
	);
	svg.appendChild(
		txt(260, 34, strings.forGsTh, { size: 11, fill: '#efece2', extra: { 'font-weight': 'bold' } })
	);
	strings.backSvgLines.forEach((line, i) => {
		svg.appendChild(txt(72, 52 + i * 13, line, { size: 8.5, fill: '#d8d6cc', anchor: 'start' }));
	});
	svg.appendChild(
		el('polygon', {
			points: `${B_CX},${B_CY - B_R - 26} ${B_CX - 9},${B_CY - B_R - 40} ${B_CX + 9},${B_CY - B_R - 40}`,
			fill: '#efece2'
		})
	);
	svg.appendChild(txt(B_CX, B_CY - B_R - 48, 'TRUE INDEX', { size: 9, fill: '#efece2' }));

	const defs = el('defs');
	const clip = el('clipPath', { id: 'e6b-winclip' });
	clip.appendChild(el('circle', { cx: B_CX, cy: B_CY, r: B_R - 29 }));
	defs.appendChild(clip);
	svg.appendChild(defs);

	// Rotating azimuth bezel: turn it to set wind direction / true course under the index.
	const ringGroup = el('g');
	const ring = el('g', { class: 'e6b-grab' });
	ring.appendChild(
		el('circle', {
			cx: B_CX,
			cy: B_CY,
			r: B_R,
			fill: '#16160f',
			stroke: '#efece2',
			'stroke-width': 1
		})
	);
	ring.appendChild(
		el('circle', {
			cx: B_CX,
			cy: B_CY,
			r: B_R - 26,
			fill: 'none',
			stroke: '#5a5a52',
			'stroke-width': 0.5
		})
	);
	for (let d = 0; d < 360; d += 2) {
		const big = d % 10 === 0,
			mid = d % 5 === 0,
			len = big ? 12 : mid ? 8 : 5;
		const p1 = polar(B_CX, B_CY, B_R, d),
			p2 = polar(B_CX, B_CY, B_R - len, d);
		ring.appendChild(
			el('line', {
				x1: p1[0],
				y1: p1[1],
				x2: p2[0],
				y2: p2[1],
				stroke: '#efece2',
				'stroke-width': big ? 1 : 0.5
			})
		);
	}
	for (let d = 0; d < 360; d += 10) {
		const pr = polar(B_CX, B_CY, B_R - 22, d);
		ring.appendChild(
			txt(pr[0], pr[1], String(d === 0 ? 360 : d), {
				size: 9,
				fill: '#efece2',
				rot: `rotate(${d} ${pr[0]} ${pr[1]})`
			})
		);
	}
	(
		[
			['N', 0],
			['E', 90],
			['S', 180],
			['W', 270]
		] as const
	).forEach(([label, d]) => {
		const pr = polar(B_CX, B_CY, B_R - 44, d);
		ring.appendChild(
			txt(pr[0], pr[1], label, { size: 17, fill: '#efece2', extra: { 'font-weight': 'bold' } })
		);
	});
	ringGroup.appendChild(ring);
	svg.appendChild(ringGroup);

	// Vertically sliding grid card (speed arcs + drift lines). Slides, never rotates.
	const slideGroup = el('g');
	const gridClip = el('g', { 'clip-path': 'url(#e6b-winclip)' });
	const grid = el('g', { class: 'e6b-grab' });
	grid.appendChild(
		el('rect', {
			x: B_CX - 220,
			y: B_CY - 340,
			width: 440,
			height: 680,
			fill: '#dfe4df',
			opacity: '0.92'
		})
	);
	for (let kt = 10; kt <= 160; kt += 10) {
		const r = kt * PXPERKT;
		grid.appendChild(
			el('circle', {
				cx: B_CX,
				cy: B_CY,
				r,
				fill: 'none',
				stroke: '#6f8f82',
				'stroke-width': kt % 20 === 0 ? 0.9 : 0.45
			})
		);
		if (kt % 20 === 0) {
			grid.appendChild(
				txt(B_CX + 5, B_CY - r, String(kt), { size: 8, fill: '#2c4339', anchor: 'start' })
			);
			grid.appendChild(
				txt(B_CX + 5, B_CY + r, String(kt), { size: 8, fill: '#2c4339', anchor: 'start' })
			);
		}
	}
	for (let a = -45; a <= 45; a += 5) {
		const top = polar(B_CX, B_CY, 340, a),
			bot = polar(B_CX, B_CY, 340, a + 180);
		grid.appendChild(
			el('line', {
				x1: bot[0],
				y1: bot[1],
				x2: top[0],
				y2: top[1],
				stroke: a === 0 ? '#2c4339' : '#6f8f82',
				'stroke-width': a === 0 ? 1.1 : 0.45
			})
		);
	}
	for (let a = 10; a <= 40; a += 10) {
		[a, -a].forEach((aa) => {
			const pr = polar(B_CX, B_CY, 150, aa);
			grid.appendChild(txt(pr[0], pr[1], String(Math.abs(aa)), { size: 8, fill: '#2c4339' }));
		});
	}
	// Highlighted TAS target circle - slide the grid until the wind dot lands on it.
	const tasCircle = el('circle', {
		cx: B_CX,
		cy: B_CY,
		r: 120 * PXPERKT,
		fill: 'none',
		stroke: '#1d6fb0',
		'stroke-width': 1.8,
		'stroke-dasharray': '5 4',
		'data-tas-arc': '1'
	});
	grid.appendChild(tasCircle);
	gridClip.appendChild(grid);
	slideGroup.appendChild(gridClip);
	svg.appendChild(slideGroup);

	// Wind dot: marked on the transparent rotating disc, so the bezel turns it.
	const dotGroup = el('g');
	const dotClip = el('g', { 'clip-path': 'url(#e6b-winclip)' });
	const dot = el('g', { class: 'e6b-grab' });
	dot.appendChild(
		el('circle', { cx: B_CX, cy: B_CY, r: 9, fill: 'none', stroke: '#a8281c', 'stroke-width': 2.5 })
	);
	dot.appendChild(el('circle', { cx: B_CX, cy: B_CY, r: 2.5, fill: '#a8281c' }));
	dotClip.appendChild(dot);
	dotGroup.appendChild(dotClip);
	svg.appendChild(dotGroup);

	// Fixed overlay: centre line, grommet (does not move with bezel or slide).
	svg.appendChild(
		el('line', {
			x1: B_CX,
			y1: B_CY - B_R + 29,
			x2: B_CX,
			y2: B_CY + B_R - 29,
			stroke: '#a8281c',
			'stroke-width': 0.7,
			opacity: '0.5'
		})
	);
	svg.appendChild(
		el('circle', { cx: B_CX, cy: B_CY, r: 6, fill: '#cfcfca', stroke: '#000', 'stroke-width': 1 })
	);
	svg.appendChild(el('circle', { cx: B_CX, cy: B_CY, r: 1.8, fill: '#000' }));
	return { svg, ringGroup, dotGroup, slideGroup, ring, grid, dot, tasCircle };
}

export interface E6bInstance {
	destroy: () => void;
}

export function createE6b(root: HTMLElement, options: { locale: E6bLocale }): E6bInstance {
	const T = E6B_STRINGS[options.locale === 'en' ? 'en' : 'pl'];
	const teardowns: Array<() => void> = [];

	root.innerHTML = `
		<div class="e6b-toolbar">
			<button type="button" data-act="front">${T.front}</button>
			<button type="button" data-act="back" class="active">${T.back}</button>
			<button type="button" data-act="reset" class="warn">${T.reset}</button>
		</div>
		<div class="e6b-modebar">
			<label><input type="radio" name="e6b-solve" value="find" checked> ${T.solveFind}</label>
			<label><input type="radio" name="e6b-solve" value="wind"> ${T.solveWind}</label>
		</div>
		<p class="e6b-sub">${T.subtitle}</p>
		<div class="e6b-view-toggle">
			<button type="button" data-view="computer" class="active">${T.viewComputer}</button>
			<button type="button" data-view="results">${T.viewResults}</button>
		</div>
		<div class="e6b-layout" data-view="computer">
			<div class="e6b-stage">
				<div class="e6b-face" data-face="front"></div>
				<div class="e6b-face show" data-face="back"></div>
			</div>
			<div class="e6b-panel"></div>
		</div>`;

	const q = <E extends Element = Element>(sel: string): E | null => root.querySelector<E>(sel);
	const faceFront = q<HTMLElement>('[data-face="front"]')!;
	const faceBack = q<HTMLElement>('[data-face="back"]')!;
	const panel = q<HTMLElement>('.e6b-panel')!;

	const F = buildFront(T);
	const R = buildBack(T);
	faceFront.appendChild(F.svg);
	faceBack.appendChild(R.svg);

	const S = { ringRot: 0, gridY: 0, dotX: 0, dotY: -40 };
	const FS = { discRot: 0, curRot: 0, cwAngle: 30, cwKt: 20, tempC: 15 };
	let solveMode: 'find' | 'wind' = 'find';
	let tasTarget = 120;
	let frontTask: 'tsd' | 'fuel' = 'tsd';

	const currentFace = (): 'front' | 'back' =>
		faceFront.classList.contains('show') ? 'front' : 'back';

	function svgPt(svg: SVGElement, ev: PointerEvent): { x: number; y: number } {
		const r = svg.getBoundingClientRect();
		return {
			x: ((ev.clientX - r.left) / r.width) * 520,
			y: ((ev.clientY - r.top) / r.height) * 760
		};
	}

	interface DragHandlers {
		shouldStart?: (ev: PointerEvent) => boolean;
		start: (ev: PointerEvent) => void;
		move: (ev: PointerEvent) => void;
	}
	function drag(target: SVGElement, handlers: DragHandlers): void {
		const move = (ev: PointerEvent): void => {
			handlers.move(ev);
			ev.preventDefault();
		};
		const end = (ev: PointerEvent): void => {
			target.removeEventListener('pointermove', move);
			target.removeEventListener('pointerup', end);
			target.removeEventListener('pointercancel', end);
			if (target.hasPointerCapture(ev.pointerId)) target.releasePointerCapture(ev.pointerId);
		};
		const down = (ev: PointerEvent): void => {
			if (handlers.shouldStart && !handlers.shouldStart(ev)) return;
			handlers.start(ev);
			target.setPointerCapture(ev.pointerId);
			target.addEventListener('pointermove', move);
			target.addEventListener('pointerup', end);
			target.addEventListener('pointercancel', end);
			ev.preventDefault();
			ev.stopPropagation();
		};
		target.addEventListener('pointerdown', down);
		teardowns.push(() => target.removeEventListener('pointerdown', down));
	}

	function updateTasArc(): void {
		R.tasCircle.setAttribute('r', String(tasTarget * PXPERKT));
	}

	// Undo the bezel rotation to express a screen point in rotating-disc coordinates.
	function screenToDisc(sx: number, sy: number): { x: number; y: number } {
		const dx = sx - B_CX,
			dy = sy - B_CY;
		const t = (-S.ringRot * Math.PI) / 180;
		return { x: dx * Math.cos(t) - dy * Math.sin(t), y: dx * Math.sin(t) + dy * Math.cos(t) };
	}

	function applyBack(): void {
		const spin = `rotate(${S.ringRot} ${B_CX} ${B_CY})`;
		R.ringGroup.setAttribute('transform', spin);
		R.dotGroup.setAttribute('transform', spin);
		R.slideGroup.setAttribute('transform', `translate(0 ${S.gridY})`);
		R.dot.setAttribute('transform', `translate(${S.dotX} ${S.dotY})`);
		updateTasArc();
		compute();
	}

	const aValueAt = (angle: number): number => Math.pow(10, 1 + (((angle % 360) + 360) % 360) / 360);
	const bAngleOf = (v: number): number => (logAngle(v) + FS.discRot) % 360;
	const aOppositeB = (bVal: number): number => aValueAt(bAngleOf(bVal));

	function applyFront(): void {
		F.disc.setAttribute('transform', `rotate(${FS.discRot} ${F.cx} ${F.cy})`);
		F.cursor.setAttribute('transform', `rotate(${FS.curRot} ${F.cx} ${F.cy})`);
		const cwR = (FS.cwKt / F.cw.maxKt) * F.cw.R,
			rad = (FS.cwAngle * Math.PI) / 180;
		F.cwMark.setAttribute(
			'transform',
			`translate(${F.cw.ox + cwR * Math.cos(rad)} ${F.cw.oy - cwR * Math.sin(rad)})`
		);
		F.tMark.setAttribute('transform', `translate(${F.temp.tX(FS.tempC)} 0)`);
		if (currentFace() === 'front') renderFrontPanel();
	}

	function compute(): void {
		// Wind dot rides the rotating disc; the grid (and its centre) only slides vertically.
		const rad = (S.ringRot * Math.PI) / 180;
		const dotScreenX = B_CX + (S.dotX * Math.cos(rad) - S.dotY * Math.sin(rad));
		const dotScreenY = B_CY + (S.dotX * Math.sin(rad) + S.dotY * Math.cos(rad));
		const gridCx = B_CX;
		const gridCy = B_CY + S.gridY;
		const underIndex = (360 - S.ringRot) % 360;
		const windKt = Math.hypot(S.dotX, S.dotY) / PXPERKT;
		const gsUnder = Math.abs(S.gridY) / PXPERKT;
		const tasAtDot = Math.hypot(dotScreenX - gridCx, dotScreenY - gridCy) / PXPERKT;
		const wca = (Math.atan2(dotScreenX - gridCx, -(dotScreenY - gridCy)) * 180) / Math.PI;
		const onTas = Math.abs(tasAtDot - tasTarget) <= 3;
		renderPanel(underIndex, windKt, wca, gsUnder, onTas, tasAtDot);
	}

	function row(label: string, value: string): string {
		return `<div class="e6b-inrow"><span>${label}</span><b>${value}</b></div>`;
	}
	function list(items: string[]): string {
		return `<ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
	}

	function renderPanel(
		underIndex: number,
		distKt: number,
		wca: number,
		gsUnder: number,
		onTas: boolean,
		tasAtDot: number
	): void {
		if (currentFace() === 'front') {
			renderFrontPanel();
			return;
		}
		const dir = Math.abs(wca) < 1 ? '' : wca > 0 ? ` ${T.right}` : ` ${T.left}`;
		const wcaTxt = `${wca >= 0 ? '+' : ''}${wca.toFixed(0)}°${dir}`;
		const hit = onTas
			? `<span class="e6b-ok">${T.hitOk}</span>`
			: `<span class="e6b-warn-text">${T.hitMiss}</span>`;
		const steps =
			solveMode === 'find'
				? `<div class="e6b-step"><b>${T.stepsFindTitle}</b>${list(T.stepsFind)}</div>`
				: `<div class="e6b-step"><b>${T.stepsWindTitle}</b>${list(T.stepsWind)}</div>`;
		panel.innerHTML =
			`<div class="e6b-card"><h3>${T.targetTas}</h3>` +
			`<div class="e6b-inrow"><span>${T.tasArc}</span><input type="number" data-tas value="${tasTarget}"></div>` +
			`<div class="e6b-auto">${hit}</div></div>` +
			`<div class="e6b-card"><h3>${T.liveReadout}</h3><div class="e6b-results">` +
			row(T.underIndex, `${underIndex.toFixed(0)}°`) +
			row(T.gsUnderCentre, `${gsUnder.toFixed(0)} kt`) +
			row(T.tasAtDot, `${tasAtDot.toFixed(0)} kt`) +
			row(T.dotFromCentre, `${distKt.toFixed(0)} kt`) +
			row(T.dotAngle, wcaTxt) +
			`</div></div>` +
			steps +
			`<div class="e6b-card"><h3>${T.mathCheck}</h3><div data-math class="e6b-mathout"></div></div>`;
		attachMath();
	}

	function attachMath(): void {
		const tin = q<HTMLInputElement>('[data-tas]');
		if (tin)
			tin.addEventListener('input', () => {
				const v = parseFloat(tin.value);
				if (!isNaN(v) && v > 0) {
					tasTarget = v;
					updateTasArc();
					const cur = tin.value;
					compute();
					const t2 = q<HTMLInputElement>('[data-tas]');
					if (t2) {
						t2.value = cur;
						t2.focus();
					}
				}
			});
		const out = q<HTMLElement>('[data-math]');
		if (!out) return;
		out.innerHTML =
			`<div class="e6b-inrow"><span>${T.tc}</span><input type="number" data-m="tc" value="290"></div>` +
			`<div class="e6b-inrow"><span>${T.tasKt}</span><input type="number" data-m="tas" value="120"></div>` +
			`<div class="e6b-inrow"><span>${T.windFrom}</span><input type="number" data-m="wd" value="320"></div>` +
			`<div class="e6b-inrow"><span>${T.windKt}</span><input type="number" data-m="ws" value="20"></div>` +
			`<div data-mres class="e6b-auto"></div>`;
		out.querySelectorAll('input[data-m]').forEach((node) => node.addEventListener('input', doMath));
		doMath();
	}

	function doMath(): void {
		const g = (k: string): number =>
			parseFloat(q<HTMLInputElement>(`[data-m="${k}"]`)?.value ?? '0') || 0;
		const tc = g('tc'),
			tas = g('tas'),
			wd = g('wd'),
			ws = g('ws');
		const wtd = ((wd - tc) * Math.PI) / 180;
		let s = (ws * Math.sin(wtd)) / tas;
		s = Math.max(-1, Math.min(1, s));
		const wca = (Math.asin(s) * 180) / Math.PI;
		const th = (((tc + wca) % 360) + 360) % 360;
		const gs = tas * Math.cos((wca * Math.PI) / 180) - ws * Math.cos(wtd);
		const res = q<HTMLElement>('[data-mres]');
		if (res)
			res.textContent = `→ WCA ${wca >= 0 ? '+' : ''}${wca.toFixed(0)}°  TH ${th.toFixed(0)}°  GS ${gs.toFixed(0)} kt`;
	}

	function renderFrontPanel(): void {
		const aUnderCur = aValueAt(FS.curRot);
		const bUnderCur = aValueAt((((FS.curRot - FS.discRot) % 360) + 360) % 360);
		const speedAtRate = aOppositeB(60);
		const headComp = Math.round(FS.cwKt * Math.cos((FS.cwAngle * Math.PI) / 180));
		const sideComp = Math.round(FS.cwKt * Math.sin((FS.cwAngle * Math.PI) / 180));
		let body: string;
		if (frontTask === 'tsd') {
			body =
				`<div class="e6b-inrow"><span>${T.gs}</span><input type="number" data-f="gs" value="120"></div>` +
				`<div class="e6b-inrow"><span>${T.distance}</span><input type="number" data-f="dist" value="45"></div>` +
				`<div class="e6b-inrow"><span>${T.timeMin}</span><input type="number" data-f="time" placeholder="?"></div>` +
				`<button type="button" class="e6b-solve-btn" data-f-set>${T.setDialsGs}</button>` +
				`<div class="e6b-auto" data-f-solve></div>`;
		} else {
			body =
				`<div class="e6b-inrow"><span>${T.burn}</span><input type="number" data-f="gph" value="9"></div>` +
				`<div class="e6b-inrow"><span>${T.timeMin}</span><input type="number" data-f="time2" value="90"></div>` +
				`<div class="e6b-inrow"><span>${T.fuelGal}</span><input type="number" data-f="fuel" placeholder="?"></div>` +
				`<button type="button" class="e6b-solve-btn" data-f-set2>${T.setDialsBurn}</button>` +
				`<div class="e6b-auto" data-f-solve2></div>`;
		}
		panel.innerHTML =
			`<div class="e6b-card"><h3>${T.task}</h3>` +
			`<div class="e6b-inrow"><span></span><select data-f-task class="e6b-select">` +
			`<option value="tsd"${frontTask === 'tsd' ? ' selected' : ''}>${T.taskTsd}</option>` +
			`<option value="fuel"${frontTask === 'fuel' ? ' selected' : ''}>${T.taskFuel}</option>` +
			`</select></div>${body}</div>` +
			`<div class="e6b-card"><h3>${T.dialReadout}</h3><div class="e6b-results">` +
			row(T.speedRate, speedAtRate.toFixed(0)) +
			row(T.underCursorA, aUnderCur.toFixed(1)) +
			row(T.underCursorB, bUnderCur.toFixed(1)) +
			`</div><div class="e6b-auto">${T.cursorHint}</div></div>` +
			`<div class="e6b-card"><h3>${T.offWheel}</h3><div class="e6b-results">` +
			row(T.windAngleSpeed, `${Math.round(FS.cwAngle)}° / ${Math.round(FS.cwKt)} kt`) +
			row(T.headwind, `${headComp} kt`) +
			row(T.crosswind, `${sideComp} kt`) +
			row(T.temperature, `${Math.round(FS.tempC)} °C = ${Math.round((FS.tempC * 9) / 5 + 32)} °F`) +
			`</div><div class="e6b-auto">${T.markerHint}</div></div>` +
			`<div class="e6b-step"><b>${T.howItWorksTitle}</b>${list(T.howItWorks)}</div>`;

		q<HTMLSelectElement>('[data-f-task]')?.addEventListener('change', (e) => {
			frontTask = (e.target as HTMLSelectElement).value as 'tsd' | 'fuel';
			renderFrontPanel();
		});
		q('[data-f-set]')?.addEventListener('click', () => {
			const gs = parseFloat(q<HTMLInputElement>('[data-f="gs"]')?.value ?? '0') || 0;
			const dist = parseFloat(q<HTMLInputElement>('[data-f="dist"]')?.value ?? '0') || 0;
			if (gs > 0) FS.discRot = (((logAngle(gs) - logAngle(60)) % 360) + 360) % 360;
			if (dist > 0) FS.curRot = logAngle(dist);
			applyFront();
			if (gs > 0 && dist > 0) {
				const t = (dist / gs) * 60;
				const ti = q<HTMLInputElement>('[data-f="time"]');
				if (ti) ti.value = t.toFixed(1);
				const sv = q<HTMLElement>('[data-f-solve]');
				if (sv) sv.textContent = T.timeResult.replace('{v}', t.toFixed(1));
			}
		});
		q('[data-f-set2]')?.addEventListener('click', () => {
			const gph = parseFloat(q<HTMLInputElement>('[data-f="gph"]')?.value ?? '0') || 0;
			const tm = parseFloat(q<HTMLInputElement>('[data-f="time2"]')?.value ?? '0') || 0;
			if (gph > 0) FS.discRot = (((logAngle(gph) - logAngle(60)) % 360) + 360) % 360;
			if (tm > 0) FS.curRot = logAngle((tm / 6) * 10);
			applyFront();
			if (gph > 0 && tm > 0) {
				const fuel = (gph * tm) / 60;
				const fi = q<HTMLInputElement>('[data-f="fuel"]');
				if (fi) fi.value = fuel.toFixed(1);
				const sv = q<HTMLElement>('[data-f-solve2]');
				if (sv) sv.textContent = T.fuelResult.replace('{v}', fuel.toFixed(1));
			}
		});
	}

	// ---- back-face drag wiring ----
	drag(
		R.ring,
		(() => {
			let start = 0,
				base = 0;
			const ang = (ev: PointerEvent): number => {
				const q2 = svgPt(R.svg, ev);
				return (Math.atan2(q2.y - B_CY, q2.x - B_CX) * 180) / Math.PI;
			};
			return {
				start: (ev) => {
					start = ang(ev);
					base = S.ringRot;
				},
				move: (ev) => {
					S.ringRot = (((base + (ang(ev) - start)) % 360) + 360) % 360;
					applyBack();
				}
			};
		})()
	);

	drag(
		R.grid,
		(() => {
			let startY = 0,
				base = 0;
			return {
				start: (ev) => {
					startY = svgPt(R.svg, ev).y;
					base = S.gridY;
				},
				move: (ev) => {
					const y = svgPt(R.svg, ev).y;
					S.gridY = Math.max(-340, Math.min(340, base + (y - startY)));
					applyBack();
				}
			};
		})()
	);
	drag(R.dot, {
		start: () => {},
		move: (ev) => {
			const p = svgPt(R.svg, ev);
			const c = screenToDisc(p.x, p.y);
			S.dotX = c.x;
			S.dotY = c.y;
			applyBack();
		}
	});

	// ---- front-face drag wiring ----
	const frontRotor = (target: SVGElement, get: () => number, set: (v: number) => void): void => {
		let start = 0,
			base = 0;
		const ang = (ev: PointerEvent): number => {
			const p = svgPt(F.svg, ev);
			return (Math.atan2(p.y - F.cy, p.x - F.cx) * 180) / Math.PI;
		};
		drag(target, {
			start: (ev) => {
				start = ang(ev);
				base = get();
			},
			move: (ev) => {
				set((((base + (ang(ev) - start)) % 360) + 360) % 360);
				applyFront();
			}
		});
	};
	frontRotor(
		F.disc,
		() => FS.discRot,
		(v) => (FS.discRot = v)
	);
	frontRotor(
		F.cursor,
		() => FS.curRot,
		(v) => (FS.curRot = v)
	);

	drag(F.cwMark, {
		start: () => {},
		move: (ev) => {
			const p = svgPt(F.svg, ev);
			const dx = p.x - F.cw.ox,
				dy = F.cw.oy - p.y;
			let ang = (Math.atan2(dy, Math.max(dx, 0.0001)) * 180) / Math.PI;
			ang = Math.max(0, Math.min(90, ang));
			let kt = (Math.hypot(dx, Math.max(dy, 0)) / F.cw.R) * F.cw.maxKt;
			kt = Math.max(0, Math.min(F.cw.maxKt, kt));
			FS.cwAngle = ang;
			FS.cwKt = kt;
			applyFront();
		}
	});
	drag(F.tMark, {
		start: () => {},
		move: (ev) => {
			const p = svgPt(F.svg, ev);
			let c =
				F.temp.cmin + ((p.x - (F.temp.X + 20)) / (F.temp.W - 40)) * (F.temp.cmax - F.temp.cmin);
			c = Math.max(F.temp.cmin, Math.min(F.temp.cmax, c));
			FS.tempC = c;
			applyFront();
		}
	});

	// ---- toolbar / modebar ----
	function show(front: boolean): void {
		faceFront.classList.toggle('show', front);
		faceBack.classList.toggle('show', !front);
		root.querySelectorAll('.e6b-toolbar button').forEach((b) => {
			const act = (b as HTMLElement).dataset.act;
			b.classList.toggle('active', (act === 'front') === front && act !== 'reset');
		});
		const modebar = q<HTMLElement>('.e6b-modebar');
		if (modebar) modebar.style.display = front ? 'none' : 'flex';
		if (front) renderFrontPanel();
		else compute();
	}

	const onToolbar = (ev: Event): void => {
		const act = (ev.target as HTMLElement).closest('button')?.dataset.act;
		if (act === 'front') show(true);
		else if (act === 'back') show(false);
		else if (act === 'reset') {
			if (currentFace() === 'front') {
				FS.discRot = 0;
				FS.curRot = 0;
				applyFront();
			} else {
				S.ringRot = 0;
				S.gridY = 0;
				S.dotX = 0;
				S.dotY = -40;
				applyBack();
			}
		}
	};
	const toolbar = q<HTMLElement>('.e6b-toolbar')!;
	toolbar.addEventListener('click', onToolbar);
	teardowns.push(() => toolbar.removeEventListener('click', onToolbar));

	const onSolve = (ev: Event): void => {
		solveMode = (ev.target as HTMLInputElement).value as 'find' | 'wind';
		compute();
	};
	root.querySelectorAll('input[name="e6b-solve"]').forEach((r) => {
		r.addEventListener('change', onSolve);
		teardowns.push(() => r.removeEventListener('change', onSolve));
	});

	const layout = q<HTMLElement>('.e6b-layout')!;
	const viewToggle = q<HTMLElement>('.e6b-view-toggle')!;
	const onView = (ev: Event): void => {
		const btn = (ev.target as HTMLElement).closest('button');
		const view = btn?.dataset.view;
		if (!view) return;
		layout.dataset.view = view;
		viewToggle
			.querySelectorAll('button')
			.forEach((b) => b.classList.toggle('active', b.dataset.view === view));
	};
	viewToggle.addEventListener('click', onView);
	teardowns.push(() => viewToggle.removeEventListener('click', onView));

	applyBack();
	applyFront();
	show(false);

	return {
		destroy() {
			teardowns.forEach((fn) => fn());
			root.innerHTML = '';
		}
	};
}
