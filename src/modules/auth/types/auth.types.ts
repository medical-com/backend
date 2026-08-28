import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	login: "/auth/login",
	register: "/auth/register",
	logout: "/auth/logout",
	me: "/auth/me",
} as const;
export type AuthPaths = Flatten<typeof paths>;
