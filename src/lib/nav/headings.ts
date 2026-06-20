/**
 * Heading conversions between true, magnetic and compass references.
 *
 * Variation (declination) and deviation are signed: WEST is positive, EAST is negative.
 * That way the forward chain true -> magnetic -> compass is always an addition
 * ("variation/deviation west, compass best; east, compass least"; TVMDC "add west").
 */

export function normalizeDeg(deg: number): number {
	const wrapped = deg % 360;
	return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** Smallest unsigned angle between two bearings, in [0, 180]. */
export function angularDiff(a: number, b: number): number {
	const diff = normalizeDeg(a - b);
	return Math.min(diff, 360 - diff);
}

export function trueToMagnetic(trueHeading: number, variation: number): number {
	return normalizeDeg(trueHeading + variation);
}

export function magneticToTrue(magneticHeading: number, variation: number): number {
	return normalizeDeg(magneticHeading - variation);
}

export function magneticToCompass(magneticHeading: number, deviation: number): number {
	return normalizeDeg(magneticHeading + deviation);
}

export function compassToMagnetic(compassHeading: number, deviation: number): number {
	return normalizeDeg(compassHeading - deviation);
}

export function trueToCompass(trueHeading: number, variation: number, deviation: number): number {
	return normalizeDeg(trueHeading + variation + deviation);
}

export function compassToTrue(
	compassHeading: number,
	variation: number,
	deviation: number
): number {
	return normalizeDeg(compassHeading - variation - deviation);
}
