import { ClientAccount } from "@/types/client/account.type";
import type { Account } from "../types";

export const toClientAccount = (account: Account): ClientAccount => {
	return {
		id: account.id,
		patient_id: account.patient_id,
		email: account.email,
		email_verified: account.email_verified,
		group: account.group,
		permissions: account.permissions,
		created_at: account.created_at,
	};
};
