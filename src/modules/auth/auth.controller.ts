import type express from "express";
import type AuthService from "./auth.service";

import { AppError } from "@/core/errors/app-error";
import { RequireAuth } from "@/core/decorators/require-auth";
import { ValidateBody } from "@/core/decorators/validate-body";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/core/security/session.store";
import { ConfirmEmailRequestSchema, LoginRequestSchema, RegisterRequestSchema } from "./types/auth.schema";
import type { ConfirmEmailResponse, LoginResponse, RegisterResponse, MeResponse } from "./types/auth.schema";

export default class AuthController {
	constructor(readonly service: AuthService) {}

	@ValidateBody(RegisterRequestSchema)
	async onRegister(req: express.Request, res: express.Response) {
		if (req.account) throw new AppError("Already logged in");

		const success = await this.service.register(req.body);

		res.status(201).json({ success } as RegisterResponse);
	}

	@ValidateBody(LoginRequestSchema)
	async onLogin(req: express.Request, res: express.Response) {
		if (req.account) throw new AppError("Already logged in");

		const { account, sessionId } = await this.service.login({ email: req.body.email, password: req.body.password });

		res.cookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
		res.json({ account, sessionId } as LoginResponse);
	}

	@RequireAuth()
	async onLogout(req: express.Request, res: express.Response) {
		const sessionId: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];
		if (sessionId) await this.service.logout({ sessionId });

		res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
		res.status(204).end();
	}

	@RequireAuth()
	async onMe(req: express.Request, res: express.Response) {
		const account = req.account;
		if (!account) throw new AppError("Authentication required", 401);

		const result = await this.service.me({ accountId: account.id });
		res.json({ data: result } as MeResponse);
	}

	@ValidateBody(ConfirmEmailRequestSchema)
	async onConfirmEmail(req: express.Request, res: express.Response) {
		const { token } = req.body;
		const success = await this.service.confirmEmail({ token });

		res.json({ success } as ConfirmEmailResponse);
	}
}
