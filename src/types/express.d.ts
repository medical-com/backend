import type { Account } from "@/database/types";

declare global {
	namespace Express {
		interface Request {
			account?: Account;
		}
	}
}

export {};
