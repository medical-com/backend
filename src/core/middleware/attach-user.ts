import type { RequestHandler } from "express";
import UserRepository from "@/database/repositories/user.repository";
import { getSession, SESSION_COOKIE_NAME } from "@/core/security/session.store";

const userRepository = new UserRepository();

// Populates req.user when a valid session cookie is present. Does not reject
// unauthenticated requests - pair with requireAuth on routes that need a user.
export const attachUser: RequestHandler = async (req, _res, next) => {
	const sessionId: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];

	if (!sessionId) {
		next();
		return;
	}

	const session = await getSession(sessionId);
	if (session) req.user = await userRepository.findById({ id: session.userId });

	next();
};
