import type express from "express";
import type AuthService from "./auth.service";

import { AppError } from "@/core/errors/app-error";
import { RequireAuth } from "@/core/decorators/require-auth";
import { ValidateBody } from "@/core/decorators/validate-body";
import { loginSchema, registerSchema } from "./types/auth.schema";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/core/security/session.store";
import { toClientAccount } from "@/database/mapper/account.mapper";

export default class AuthController {
	constructor(readonly service: AuthService) {}

	@ValidateBody(registerSchema)
	async onRegister(req: express.Request, res: express.Response) {
		if (req.account) throw new AppError("Already logged in");

		const account = await this.service.register(req.body);

		res.status(201).json({ account: toClientAccount(account) });
	}

	@ValidateBody(loginSchema)
	async onLogin(req: express.Request, res: express.Response) {
		if (req.account) throw new AppError("Already logged in");

		const { account, sessionId } = await this.service.login({ email: req.body.email, password: req.body.password });

		res.cookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
		res.json({ account: toClientAccount(account) });
	}

	async onLogout(req: express.Request, res: express.Response) {
		const sessionId: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];
		if (sessionId) await this.service.logout({ sessionId });

		res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
		res.status(204).end();
	}

	@RequireAuth()
	onMe(req: express.Request, res: express.Response) {
		const account = req.account;
		if (!account) throw new AppError("Authentication required", 401);

		res.json({ account: toClientAccount(account) });
	}
}
