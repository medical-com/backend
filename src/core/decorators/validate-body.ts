import type express from "express";
import type { ZodType } from "zod";
import { AppError } from "@/core/errors/app-error";

type HandlerMethod = (req: express.Request, res: express.Response, ...args: any[]) => any;

export function ValidateBody(schema: ZodType) {
	return (target: HandlerMethod, _context: ClassMethodDecoratorContext) => {
		return function (this: unknown, req: express.Request, res: express.Response, ...args: any[]) {
			const result = schema.safeParse(req.body);

			if (!result.success) {
				throw new AppError(result.error.issues.map((issue) => issue.message).join(", "), 400);
			}

			req.body = result.data;

			return target.call(this, req, res, ...args);
		};
	};
}
