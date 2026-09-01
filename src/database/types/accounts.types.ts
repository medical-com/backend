//public.accounts
export type Account = {
	id: string;
	patient_id: string;
	email: string;
	email_verified: boolean;
	password_hash: string;
	group: AccountGroup;
	permissions?: AccountPermission[];
	last_login_at: Date;
	updated_at: Date;
	created_at: Date;
};

export enum AccountGroup {
	ADMIN = "admin",
	RECEPTIONIST = "receptionist",
	DOCTOR = "doctor",
	PATIENT = "patient",
}

export enum AccountPermission {
	READ_ACCOUNTS = "read_accounts",
	WRITE_ACCOUNTS = "write_accounts",
}
