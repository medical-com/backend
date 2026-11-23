import type { Server } from "socket.io";
import { parse } from "cookie";

import { getSession, SESSION_COOKIE_NAME } from "@/core/security/session.store";

import { accountRepository } from "@/database/repositories";

export const registerSocketAuth = (io: Server) => {
	io.use(async (socket, next) => {
		try {
			const cookies = parse(socket.handshake.headers.cookie ?? "");
			const sessionId = cookies[SESSION_COOKIE_NAME];
			if (!sessionId) return next(new Error("Authentication required"));

			const session = await getSession(sessionId);
			if (!session) return next(new Error("Invalid session"));

			const account = await accountRepository.findById({
				id: session.userId,
			});
			if (!account) return next(new Error("Account not found"));

			socket.data.account = account;

			next();
		} catch {
			next(new Error("Authentication failed"));
		}
	});
};
