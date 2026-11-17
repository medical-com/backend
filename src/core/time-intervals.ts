/**
 * Utilities for merging and subtracting half-open time intervals [start, end).
 * `start` and `end` are Unix timestamps in milliseconds (Date.getTime()).
 */
export interface TimeInterval {
	start: number;
	end: number;
}

function assertValidInterval(interval: TimeInterval): void {
	if (!Number.isFinite(interval.start) || !Number.isFinite(interval.end) || interval.start >= interval.end) {
		throw new RangeError(
			`Invalid interval: expected finite start < end, received [${interval.start}, ${interval.end})`,
		);
	}
}

/**
 * Combines overlapping or touching intervals.
 * Does not modify the input array or its objects.
 * Time complexity: O(n log n).
 */
export function mergeIntervals(intervals: readonly TimeInterval[]): TimeInterval[] {
	for (const interval of intervals) assertValidInterval(interval);

	const sorted = [...intervals].sort((a, b) => a.start - b.start);
	const merged: TimeInterval[] = [];

	for (const current of sorted) {
		const last = merged[merged.length - 1];

		if (!last || current.start > last.end) {
			merged.push({ ...current });
		} else {
			last.end = Math.max(last.end, current.end);
		}
	}

	return merged;
}

/**
 * Subtracts all blocked intervals from available intervals.
 * Returns sorted, non-overlapping intervals, without modifying inputs.
 * Touching endpoints do not overlap: [8, 9) and [9, 10) are adjacent.
 * Time complexity: O((n + m) log(n + m)) for n available and m blocked intervals.
 */
export function subtractIntervals(
	available: readonly TimeInterval[],
	blocked: readonly TimeInterval[],
): TimeInterval[] {
	const availability = mergeIntervals(available);
	const exclusions = mergeIntervals(blocked);
	const result: TimeInterval[] = [];
	let blockedIndex = 0;

	for (const interval of availability) {
		let cursor = interval.start;

		while (blockedIndex < exclusions.length && exclusions[blockedIndex]!.end <= cursor) {
			blockedIndex++;
		}

		let i = blockedIndex;
		while (i < exclusions.length && exclusions[i]!.start < interval.end) {
			const exclusion = exclusions[i];

			if (exclusion!.start > cursor) {
				result.push({ start: cursor, end: Math.min(exclusion!.start, interval.end) });
			}

			cursor = Math.max(cursor, Math.min(exclusion!.end, interval.end));
			if (cursor >= interval.end) break;
			i++;
		}

		if (cursor < interval.end) {
			result.push({ start: cursor, end: interval.end });
		}
	}

	return result;
}
