
type RestMethod = "get" | "post" | "put" | "delete" | "patch"

/**
 * Extracts the keys of a deeply nested object and returns them formatted as path
 */
export type DeepKeys<T, Stop extends string = RestMethod> = T extends object
	? {
			[K in keyof T]: K extends string
				? K extends Stop
					? K
					: T[K] extends object
						? K | `${K}/${DeepKeys<T[K], Stop>}`
						: K
				: never
		}[keyof T]
	: never
