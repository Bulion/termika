import { mulberry32, seededShuffle } from '$lib/engine/shuffle';

export interface LocalizedText {
	pl: string;
	en: string;
}
export interface MetarToken {
	raw: string;
	correct: LocalizedText;
	options: LocalizedText[];
	answerIndex: number;
}
export interface GeneratedMetar {
	raw: string;
	context: string;
	tokens: MetarToken[];
}

interface Candidate {
	raw: string;
	text: LocalizedText;
}
type Rng = () => number;

const pad = (value: number, width: number): string => String(value).padStart(width, '0');
const intIn = (rng: Rng, min: number, max: number, step = 1): number =>
	min + step * Math.floor(rng() * Math.floor((max - min) / step + 1));

const STATIONS = ['EPKK', 'EPWA', 'EPGD', 'EPPO', 'EPWR', 'EPLB'];

function normalWind(rng: Rng): Candidate {
	const dir = intIn(rng, 1, 36) * 10;
	const spd = intIn(rng, 3, 28);
	return {
		raw: `${pad(dir, 3)}${pad(spd, 2)}KT`,
		text: { pl: `wiatr ${dir}° / ${spd} kt`, en: `wind ${dir}° / ${spd} kt` }
	};
}
function windCorrect(rng: Rng): Candidate {
	const r = rng();
	if (r < 0.12) return { raw: '00000KT', text: { pl: 'cisza (bezwietrznie)', en: 'calm' } };
	if (r < 0.27) {
		const spd = intIn(rng, 1, 6);
		return {
			raw: `VRB${pad(spd, 2)}KT`,
			text: { pl: `wiatr zmienny / ${spd} kt`, en: `variable wind / ${spd} kt` }
		};
	}
	if (r < 0.45) {
		const dir = intIn(rng, 1, 36) * 10;
		const spd = intIn(rng, 8, 18);
		const gust = spd + intIn(rng, 8, 16);
		return {
			raw: `${pad(dir, 3)}${pad(spd, 2)}G${pad(gust, 2)}KT`,
			text: {
				pl: `wiatr ${dir}° / ${spd} kt, porywy ${gust} kt`,
				en: `wind ${dir}° / ${spd} kt, gusting ${gust} kt`
			}
		};
	}
	return normalWind(rng);
}

function visibility(rng: Rng): Candidate {
	if (rng() < 0.4)
		return {
			raw: '9999',
			text: { pl: 'widzialność 10 km lub więcej', en: 'visibility 10 km or more' }
		};
	const m = intIn(rng, 800, 9000, 100);
	return { raw: pad(m, 4), text: { pl: `widzialność ${m} m`, en: `visibility ${m} m` } };
}

const WEATHER: Candidate[] = [
	{ raw: '-RA', text: { pl: 'słaby deszcz', en: 'light rain' } },
	{ raw: 'RA', text: { pl: 'deszcz', en: 'rain' } },
	{ raw: 'SHRA', text: { pl: 'przelotny deszcz', en: 'rain showers' } },
	{ raw: 'TSRA', text: { pl: 'burza z deszczem', en: 'thunderstorm with rain' } },
	{ raw: '-SN', text: { pl: 'słaby śnieg', en: 'light snow' } },
	{ raw: 'BR', text: { pl: 'zamglenie', en: 'mist' } },
	{ raw: 'FG', text: { pl: 'mgła', en: 'fog' } },
	{ raw: 'HZ', text: { pl: 'zmętnienie', en: 'haze' } }
];
const weather = (rng: Rng): Candidate => WEATHER[intIn(rng, 0, WEATHER.length - 1)];

const CLOUD_AMOUNTS: { code: string; pl: string; en: string }[] = [
	{ code: 'FEW', pl: 'zachmurzenie małe (1-2/8)', en: 'few (1-2/8)' },
	{ code: 'SCT', pl: 'zachmurzenie umiarkowane (3-4/8)', en: 'scattered (3-4/8)' },
	{ code: 'BKN', pl: 'zachmurzenie duże (5-7/8)', en: 'broken (5-7/8)' },
	{ code: 'OVC', pl: 'zachmurzenie całkowite (8/8)', en: 'overcast (8/8)' }
];
function cloud(rng: Rng): Candidate {
	if (rng() < 0.12)
		return { raw: 'NSC', text: { pl: 'brak istotnych chmur', en: 'no significant cloud' } };
	const a = CLOUD_AMOUNTS[intIn(rng, 0, CLOUD_AMOUNTS.length - 1)];
	const h = intIn(rng, 5, 120, 5);
	return {
		raw: `${a.code}${pad(h, 3)}`,
		text: { pl: `${a.pl} na ${h * 100} ft`, en: `${a.en} at ${h * 100} ft` }
	};
}

const fmtTemp = (v: number): string => (v < 0 ? `M${pad(-v, 2)}` : pad(v, 2));
function tempDew(rng: Rng): Candidate {
	const t = intIn(rng, -5, 30);
	const d = t - intIn(rng, 0, 6);
	return {
		raw: `${fmtTemp(t)}/${fmtTemp(d)}`,
		text: {
			pl: `temperatura ${t}°C, punkt rosy ${d}°C`,
			en: `temperature ${t}°C, dew point ${d}°C`
		}
	};
}

function pressure(rng: Rng): Candidate {
	const q = intIn(rng, 985, 1035);
	return { raw: `Q${q}`, text: { pl: `QNH ${q} hPa`, en: `QNH ${q} hPa` } };
}

function distractors(
	rng: Rng,
	gen: (r: Rng) => Candidate,
	correct: Candidate,
	count = 3
): Candidate[] {
	const out: Candidate[] = [];
	const seen = new Set([correct.text.pl]);
	for (let guard = 0; out.length < count && guard < 200; guard++) {
		const candidate = gen(rng);
		if (!seen.has(candidate.text.pl)) {
			seen.add(candidate.text.pl);
			out.push(candidate);
		}
	}
	return out;
}

function toToken(rng: Rng, correct: Candidate, gen: (r: Rng) => Candidate): MetarToken {
	const options = seededShuffle(
		[correct, ...distractors(rng, gen, correct)],
		Math.floor(rng() * 2 ** 31)
	);
	return {
		raw: correct.raw,
		correct: correct.text,
		options: options.map((c) => c.text),
		answerIndex: options.indexOf(correct)
	};
}

/** Builds a procedurally generated, valid METAR with a decoding token for each weather group. */
export function generateMetar(seed: number): GeneratedMetar {
	const rng = mulberry32(seed);
	const station = STATIONS[intIn(rng, 0, STATIONS.length - 1)];
	const time = `${pad(intIn(rng, 1, 28), 2)}${pad(intIn(rng, 0, 23), 2)}${pad(intIn(rng, 0, 5) * 10, 2)}Z`;
	const context = `${station} ${time}`;

	const tokens: MetarToken[] = [
		toToken(rng, windCorrect(rng), normalWind),
		toToken(rng, visibility(rng), visibility)
	];
	if (rng() < 0.5) tokens.push(toToken(rng, weather(rng), weather));
	tokens.push(toToken(rng, cloud(rng), cloud));
	tokens.push(toToken(rng, tempDew(rng), tempDew));
	tokens.push(toToken(rng, pressure(rng), pressure));

	const raw = `${context} ${tokens.map((t) => t.raw).join(' ')}`;
	return { raw, context, tokens };
}
