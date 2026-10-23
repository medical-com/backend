import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const hash = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

	return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const [salt, hash] = storedHash.split(":");
	if (!salt || !hash) return false;

	const hashBuffer = Buffer.from(hash, "hex");
	const derivedBuffer = (await scrypt(password, salt, hashBuffer.length)) as Buffer;

	return timingSafeEqual(hashBuffer, derivedBuffer);
}

export async function randomPassword(length: number = 12): Promise<string> {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";
	let password = "";
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		password += charset[randomIndex];
	}
	return await hashPassword(password);
}
