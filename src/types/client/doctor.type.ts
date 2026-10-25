import type { ClientPerson } from "./person.type";

export interface ClientDoctor extends ClientPerson {
	licenseNumber: string;
	specialization: string;
}
