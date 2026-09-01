import { Account } from "@/database/types";

export type ClientAccount = Omit<Account, "password_hash" | "last_login_at" | "updated_at">;
