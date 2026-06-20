import { normalizeDeg } from './headings';

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

export interface WindSolution {
	/** Wind correction angle in degrees; positive means crab into the wind to the right. */
	windCorrectionAngle: number;
	/** Heading to fly (true) so the resulting track matches the course. */
	trueHeading: number;
	groundSpeed: number;
}

/**
 * Solves the navigation wind triangle, the core of the E6B wind side.
 * `windDirection` is the direction the wind blows FROM, in degrees true.
 * Throws when the crosswind exceeds the true airspeed (no steady solution exists).
 */
export function solveWindTriangle(
	tas: number,
	trueCourse: number,
	windDirection: number,
	windSpeed: number
): WindSolution {
	if (tas <= 0) throw new RangeError(`tas must be > 0, got ${tas}`);
	const windAngle = toRad(windDirection - trueCourse);
	const crosswind = windSpeed * Math.sin(windAngle);
	const headwind = windSpeed * Math.cos(windAngle);
	const ratio = crosswind / tas;
	if (Math.abs(ratio) > 1) {
		throw new RangeError(`crosswind ${crosswind.toFixed(1)} exceeds TAS ${tas}`);
	}
	const windCorrectionAngle = toDeg(Math.asin(ratio));
	const trueHeading = normalizeDeg(trueCourse + windCorrectionAngle);
	const groundSpeed = tas * Math.cos(toRad(windCorrectionAngle)) - headwind;
	return { windCorrectionAngle, trueHeading, groundSpeed };
}
