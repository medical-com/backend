import type express from "express";
import type AuthService from "./auth.service";

import { AppError } from "@/core/errors/app-error";
import { RequireAuth } from "@/core/decorators/require-auth";
import { ValidateBody } from "@/core/decorators/validate-body";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/core/security/session.store";
import {
	ConfirmEmailRequestSchema,
	ForgotPasswordRequestSchema,
	LoginRequestSchema,
	RegisterRequestSchema,
	ResetPasswordRequestSchema,
} from "./types/auth.schema";
import type {
	ConfirmEmailResponse,
	ForgotPasswordResponse,
	LoginResponse,
	RegisterResponse,
	MeResponse,
	ResetPasswordResponse,
} from "./types/auth.schema";
import { Throttle } from "@/core/decorators/throttle";

export default class AuthController {
	constructor(readonly service: AuthService) {}

	@ValidateBody(RegisterRequestSchema)
	@Throttle({
		limit: 5,
		windowMs: 15 * 60 * 1000,
	})
	async onRegister(req: express.Request, res: express.Response<RegisterResponse>) {
		if (req.account) throw new AppError("Already logged in");

		const success = await this.service.register(req.body);

		res.status(201).json({ success });
	}

	@ValidateBody(LoginRequestSchema)
	@Throttle({
		limit: 5,
		windowMs: 15 * 60 * 1000,
	})
	async onLogin(req: express.Request, res: express.Response<LoginResponse>) {
		if (req.account) throw new AppError("Already logged in");

		const { clientAccount, sessionId } = await this.service.login({
			email: req.body.email,
			password: req.body.password,
		});

		res.cookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);

		res.json({ clientAccount });
	}

	@RequireAuth()
	async onLogout(req: express.Request, res: express.Response) {
		const sessionId: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];

		if (sessionId) await this.service.logout({ sessionId });

		res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);

		res.status(204).end();
	}

	async onMe(req: express.Request, res: express.Response<MeResponse>) {
		const account = req.account;

		if (!account) return res.json({ data: null });

		const data = await this.service.me({
			accountId: account.id,
		});

		res.json({ data });
	}

	@ValidateBody(ConfirmEmailRequestSchema)
	@Throttle({
		limit: 5,
		windowMs: 15 * 60 * 1000,
	})
	async onConfirmEmail(req: express.Request, res: express.Response<ConfirmEmailResponse>) {
		const { token } = req.body;

		const success = await this.service.confirmEmail({ token });

		res.json({ success });
	}

	@ValidateBody(ForgotPasswordRequestSchema)
	@Throttle({
		limit: 3,
		windowMs: 15 * 60 * 1000,
	})
	async onForgotPassword(req: express.Request, res: express.Response<ForgotPasswordResponse>) {
		const { email } = req.body;

		const success = await this.service.forgotPassword({ email });

		res.json({ success });
	}

	@ValidateBody(ResetPasswordRequestSchema)
	@Throttle({
		limit: 5,
		windowMs: 15 * 60 * 1000,
	})
	async onResetPassword(req: express.Request, res: express.Response<ResetPasswordResponse>) {
		const { token, password } = req.body;

		const success = await this.service.resetPassword({
			token,
			password,
		});

		res.json({ success });
	}
}
