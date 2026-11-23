import type { Account } from "@/database/types";

declare module "socket.io" {
	interface SocketData {
		account?: Account;
	}
}
