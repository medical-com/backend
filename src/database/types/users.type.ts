//public.users
export enum UserRole {
	OWNER = "owner",
	MANAGER = "manager",
	DOCTOR = "doctor",
	PATIENT = "patient",
}

export enum AuthProvider {
	LOCAL = "local",
}

export type User = {
	id: string;
	username: string;
	password: string;
	email: string;
	role: UserRole;
	permissions?: string;
	auth_provider: AuthProvider;
	last_login_at: Date;
	updated_at: Date;
	created_at: Date;
};
