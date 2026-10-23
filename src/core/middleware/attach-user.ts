import type { RequestHandler } from "express";
import { getSession, SESSION_COOKIE_NAME } from "@/core/security/session.store";
import { accountRepository } from "@/database/repositories";

// Populates req.account when a valid session cookie is present. Does not reject
// unauthenticated requests - pair with requireAuth on routes that need an account.
export const attachUser: RequestHandler = async (req, _res, next) => {
	const sessionId: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];

	if (!sessionId) {
		next();
		return;
	}

	const session = await getSession(sessionId);
	if (session) req.account = await accountRepository.findById({ id: session.userId });

	next();
};
