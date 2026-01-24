/**
 * Checks if a value is defined and not null.
 *
 * @param val - The value to check.
 * @returns True if the value is defined, false otherwise.
 */
export const isDefined = <T = undefined | unknown>(
	val: T,
): val is T extends undefined ? never : T => {
	return val !== undefined && val !== null
}
