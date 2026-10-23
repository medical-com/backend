import type { ClientPerson } from "./person.type";

export interface ClientAccount extends ClientPerson {
	emailVerified: boolean;
	role: string;
	createdAt: Date;
}
