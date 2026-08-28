import type express from "express";

export type Flatten<T> = {
	[K in keyof T]: T[K] extends string ? T[K] : T[K] extends Record<string, any> ? Flatten<T[K]> : never;
}[keyof T];

// Omit the wide string-typed methods from express.Router first - otherwise TS treats
// the intersection below as overloads and happily matches Router's own "any string"
// signature instead of narrowing the path to T. Router is itself a callable
// RequestHandler (used by app.use), and Omit/Pick always drop call signatures, so
// express.RequestHandler is intersected back in to keep it usable as middleware.
export type TypedRouter<T> = express.RequestHandler &
	Omit<express.Router, "post" | "get" | "patch"> & {
		post: (path: T, ...handlers: express.RequestHandler[]) => express.Router;
		get: (path: T, ...handlers: express.RequestHandler[]) => express.Router;
		patch: (path: T, ...handlers: express.RequestHandler[]) => express.Router;
	};
