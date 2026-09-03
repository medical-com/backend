//public.accounts
export interface Account {
	id: string;
	person_id: string;
	email: string;
	email_verified: boolean;
	password_hash: string;
	role: AccountRole;
	status: AccountStatus;
	last_login_at: Date | null;
	created_at: Date;
	updated_at: Date;
}

export enum AccountRole {
	ADMIN = "admin",
	RECEPTIONIST = "receptionist",
	DOCTOR = "doctor",
	PATIENT = "patient",
}

export enum AccountStatus {
	INVITED = "invited",
	ACTIVE = "active",
	DISABLED = "disabled",
}
