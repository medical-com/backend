import type { User } from "@/database/types";

declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}

export {};
