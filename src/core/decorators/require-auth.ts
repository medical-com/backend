import type express from "express";
import { AppError } from "@/core/errors/app-error";

type HandlerMethod = (req: express.Request, res: express.Response, ...args: any[]) => any;

export function RequireAuth() {
	return (target: HandlerMethod, _context: ClassMethodDecoratorContext) => {
		return function (this: unknown, req: express.Request, res: express.Response, ...args: any[]) {
			if (!req.account) throw new AppError("Authentication required", 401);

			return target.call(this, req, res, ...args);
		};
	};
}
