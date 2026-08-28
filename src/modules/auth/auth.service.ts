import type UserRepository from "@/database/repositories/user.repository";

import { AppError } from "@/core/errors/app-error";
import { hashPassword, verifyPassword } from "@/core/security/password";
import { AuthProvider, type User } from "@/database/types";
import { createSession, destroySession } from "../../core/security/session.store";

export default class AuthService {
	constructor(readonly userRepository: UserRepository) {}

	async register(data: {
		email: string;
		username: string;
		password: string;
	}): Promise<{ user: User; sessionId: string }> {
		const [existingEmail, existingUsername] = await Promise.all([
			this.userRepository.findByEmail({ email: data.email }),
			this.userRepository.findByUsername({ username: data.username }),
		]);
		if (existingEmail || existingUsername) throw new AppError("Email or username is already taken", 409);

		const password = await hashPassword(data.password);
		const user = await this.userRepository.insert({
			email: data.email,
			username: data.username,
			password,
			auth_provider: AuthProvider.LOCAL,
		});

		const sessionId = await createSession(user.id);

		return { user, sessionId };
	}

	async login(data: {
		provider: AuthProvider;
		data: { username: string; password: string };
	}): Promise<{ user: User; sessionId: string }> {
		const user = await this.userRepository.findByUsername({ username: data.data.username });
		if (!user || !(await verifyPassword(data.data.password, user.password)))
			throw new AppError("Invalid username or password", 401);

		await this.userRepository.updateLastLoginAt({ id: user.id });

		const sessionId = await createSession(user.id);

		return { user, sessionId };
	}

	async logout(data: { sessionId: string }): Promise<boolean> {
		await destroySession(data.sessionId);

		return true;
	}
}
