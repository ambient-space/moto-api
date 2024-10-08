import type Elysia from "elysia"
import type { InferContext } from "elysia"

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

type Split<
	S extends string,
	D extends string,
> = S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S]

/**
 * Extracts the type of a nested object access path
 */
type PathToNestedObjectAccess<
	O extends Record<string, unknown>,
	T extends DeepKeys<O>,
> = Split<T, "/">["length"] extends 1
	? O[T]
	: T extends `${infer F}/${infer R}`
		? F extends keyof O
			? O[F] extends Record<string, unknown>
				? R extends DeepKeys<O[F]>
					? PathToNestedObjectAccess<O[F], R>
					: never
				: never
			: never
		: never

/**
 * Infers the context of a route handler
 */
export type InferRouteContext<
	// biome-ignore lint/suspicious/noExplicitAny: generics are used to infer the context
	T extends Elysia<any, any, any, any, any, any, any, any>,
	U extends DeepKeys<T["_routes"]>,
> = Omit<PathToNestedObjectAccess<T["_routes"], U>, "response"> &
	Omit<InferContext<T>, "params">
