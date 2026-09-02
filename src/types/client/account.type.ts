export type ClientAccount = {
	id: string;
	patientId: string;
	email: string;
	group: string;
	emailVerified: boolean;
	createdAt: Date;
	permissions?: string[];
};
