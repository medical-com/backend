export type ClientAvailableDate = {
	id: string;
	date: string;
	doctor: {
		id: string;
		firstName: string;
		lastName: string;
	};
	serviceId: string;
	slots: string[];
};
