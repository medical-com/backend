import type { User } from "../types";

export const toClientUser = (user: User) => {
	const { password: _password, ...clientUser } = user;

	return clientUser;
};
