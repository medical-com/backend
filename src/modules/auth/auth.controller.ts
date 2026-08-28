import type express from "express";
import type AuthService from "./auth.service";

import { AppError } from "@/core/errors/app-error";
import { RequireAuth } from "@/core/decorators/require-auth";
import { ValidateBody } from "@/core/decorators/validate-body";
import { AuthProvider } from "@/database/types";
import { loginSchema, registerSchema } from "./types/auth.schema";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/core/security/session.store";
import { toClientUser } from "@/database/mapper/user.mapper";

export default class AuthController {
	constructor(readonly service: AuthService) {}

	@ValidateBody(registerSchema)
	async onRegister(req: express.Request, res: express.Response) {
		if (req.user) throw new AppError("Already logged in");

		const { user, sessionId } = await this.service.register(req.body);

		res.cookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
		res.status(201).json({ user: toClientUser(user) });
	}

	@ValidateBody(loginSchema)
	async onLogin(req: express.Request, res: express.Response) {
		if (req.user) throw new AppError("Already logged in");

		const { user, sessionId } = await this.service.login({ provider: AuthProvider.LOCAL, data: req.body });

		res.cookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
		res.json({ user: toClientUser(user) });
	}

	async onLogout(req: express.Request, res: express.Response) {
		const sessionId: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];
		if (sessionId) await this.service.logout({ sessionId });

		res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
		res.status(204).end();
	}

	@RequireAuth()
	onMe(req: express.Request, res: express.Response) {
		const user = req.user;
		if (!user) throw new AppError("Authentication required", 401);

		res.json({ user: toClientUser(user) });
	}
}
