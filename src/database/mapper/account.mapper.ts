import { ClientAccount } from "@/types/client/account.type";
import type { Account } from "../types";

export const toClientAccount = (account: Account): ClientAccount => {
	return {
		id: account.id,
		patientId: account.patient_id,
		email: account.email,
		emailVerified: account.email_verified,
		group: account.group,
		permissions: account.permissions,
		createdAt: account.created_at,
	};
};
