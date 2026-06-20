export interface FluencyConfig {
	/** How many recent attempts define current fluency. */
	window: number;
	/** Minimum attempts before an item can graduate. */
	minAttempts: number;
	/** Required accuracy over the window, 0..1. */
	targetAccuracy: number;
	/** Required median answer latency to count as automatic. */
	maxMedianLatencyMs: number;
}

export const DEFAULT_FLUENCY_CONFIG: FluencyConfig = {
	window: 10,
	minAttempts: 6,
	targetAccuracy: 0.9,
	maxMedianLatencyMs: 6000
};

export interface FluencyState {
	attempts: number;
	correct: number;
	recentResults: boolean[];
	recentLatencies: number[];
	medianLatencyMs: number;
	graduated: boolean;
}

export function emptyFluency(): FluencyState {
	return {
		attempts: 0,
		correct: 0,
		recentResults: [],
		recentLatencies: [],
		medianLatencyMs: 0,
		graduated: false
	};
}

export function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export interface Attempt {
	correct: boolean;
	latencyMs: number;
}

export function updateFluency(
	prev: FluencyState,
	attempt: Attempt,
	config: FluencyConfig = DEFAULT_FLUENCY_CONFIG
): FluencyState {
	if (attempt.latencyMs < 0)
		throw new RangeError(`latencyMs must be >= 0, got ${attempt.latencyMs}`);
	const recentResults = [...prev.recentResults, attempt.correct].slice(-config.window);
	const recentLatencies = [...prev.recentLatencies, attempt.latencyMs].slice(-config.window);
	const windowCorrect = recentResults.filter(Boolean).length;
	const accuracy = recentResults.length === 0 ? 0 : windowCorrect / recentResults.length;
	const medianLatencyMs = median(recentLatencies);
	const attempts = prev.attempts + 1;
	const graduated =
		attempts >= config.minAttempts &&
		recentResults.length >= config.minAttempts &&
		accuracy >= config.targetAccuracy &&
		medianLatencyMs <= config.maxMedianLatencyMs;

	return {
		attempts,
		correct: prev.correct + (attempt.correct ? 1 : 0),
		recentResults,
		recentLatencies,
		medianLatencyMs,
		graduated
	};
}
