import { randomUUID } from "node:crypto";
import type { CookieOptions } from "express";
import { config } from "@/core/config";
import redis from "@/core/redis";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_KEY_PREFIX = "session:";

export const SESSION_COOKIE_NAME = "sid";

export const SESSION_COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	sameSite: "lax",
	secure: config.env === "production",
	maxAge: SESSION_TTL_SECONDS * 1000,
};

export type Session = {
	userId: string;
};

export async function createSession(userId: string): Promise<string> {
	const sessionId = randomUUID();
	const session: Session = { userId };

	await redis.set(`${SESSION_KEY_PREFIX}${sessionId}`, JSON.stringify(session), "EX", SESSION_TTL_SECONDS);

	return sessionId;
}

export async function getSession(sessionId: string): Promise<Session | undefined> {
	const raw = await redis.get(`${SESSION_KEY_PREFIX}${sessionId}`);

	return raw ? (JSON.parse(raw) as Session) : undefined;
}

export async function destroySession(sessionId: string): Promise<void> {
	await redis.del(`${SESSION_KEY_PREFIX}${sessionId}`);
}

export async function destroyAllSessionsForUser(userId: string): Promise<void> {
	const keys = await redis.keys(`${SESSION_KEY_PREFIX}*`);
	const pipeline = redis.pipeline();

	for (const key of keys) {
		const raw = await redis.get(key);
		if (!raw) continue;

		const session: Session = JSON.parse(raw);
		if (session.userId === userId) pipeline.del(key);
	}

	await pipeline.exec();
}
