import type express from "express";

import { AppError } from "@/core/errors/app-error";
import { AccountRole } from "@/database/types";
import { accountRepository } from "@/database/repositories";

type HandlerMethod = (req: express.Request, res: express.Response, ...args: any[]) => any;

export function RequireAuth({ roles }: { roles?: AccountRole[] } = {}) {
	return (target: HandlerMethod, _context: ClassMethodDecoratorContext) => {
		return async function (this: unknown, req: express.Request, res: express.Response, ...args: any[]) {
			if (!req.account) throw new AppError("Authentication required", 401);
			const account = await accountRepository.findById({ id: req.account.id });
			if (!account) throw new AppError("Account not found", 404);

			if (roles && !roles.includes(account.role)) throw new AppError("Forbidden", 403);
			return target.call(this, req, res, ...args);
		};
	};
}
