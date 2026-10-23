import type express from "express";
import { AppError } from "@/core/errors/app-error";
import redis from "@/core/redis";

type HandlerMethod = (req: express.Request, res: express.Response, ...args: any[]) => any;

interface ThrottleOptions {
	limit: number;
	windowMs: number;
}

export function Throttle({ limit, windowMs }: ThrottleOptions) {
	if (!Number.isInteger(limit) || limit < 1) throw new Error("Throttle limit must be a positive integer");
	if (!Number.isInteger(windowMs) || windowMs < 1) throw new Error("Throttle windowMs must be a positive integer");

	return (target: HandlerMethod, context: ClassMethodDecoratorContext) => {
		return async function (this: unknown, req: express.Request, res: express.Response, ...args: any[]) {
			const ip = req.ip ?? "unknown";
			const method = String(context.name);
			const key = `throttle:${method}:${ip}`;

			const count = await redis.incr(key);

			if (count === 1) await redis.pexpire(key, windowMs);
			if (count > limit) {
				const ttl = await redis.pttl(key);
				const retryAfter = Math.max(1, Math.ceil(ttl / 1000));

				res.setHeader("Retry-After", retryAfter);

				throw new AppError("Too many requests. Please try again later.", 429);
			}

			return target.call(this, req, res, ...args);
		};
	};
}
