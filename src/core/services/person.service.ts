import { AppError } from "@/core/errors/app-error";
import { personRepository } from "@/database/repositories";
import { Person } from "@/database/types/persons.types";
import { Knex } from "knex";

export const createPerson = async (
	data: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		pesel: string;
		dateOfBirth: string | Date;
	},
	trx?: Knex.Transaction,
): Promise<Person> => {
	const { firstName, lastName, email, phone, pesel, dateOfBirth } = data;
	if (pesel.length !== 11 || !/^\d+$/.test(pesel)) throw new AppError("Invalid PESEL format", 400);
	if (!isBirthDateMatchingPesel(new Date(dateOfBirth), pesel))
		throw new AppError("Date of birth does not match PESEL", 400);

	const [existingPesel, existingEmail, existingPhone] = await Promise.all([
		personRepository.findByPesel({ pesel }, trx),
		personRepository.findByEmail({ email }, trx),
		personRepository.findByPhone({ phone }, trx),
	]);
	if (existingPesel) throw new AppError("PESEL already exists", 409);
	if (existingEmail) throw new AppError("Email already exists", 409);
	if (existingPhone) throw new AppError("Phone number already exists", 409);

	const person = await personRepository.insert(
		{
			first_name: firstName,
			last_name: lastName,
			email,
			phone,
			date_of_birth: new Date(dateOfBirth),
			pesel,
		},
		trx,
	);

	return person;
};

const isBirthDateMatchingPesel = (birthDate: Date, pesel: string): boolean => {
	if (!/^\d{11}$/.test(pesel) || isNaN(birthDate.getTime())) {
		return false;
	}

	const year = Number(pesel.substring(0, 2));
	const encodedMonth = Number(pesel.substring(2, 4));
	const day = Number(pesel.substring(4, 6));

	const centuryOffsets: Record<number, number> = {
		0: 1900,
		20: 2000,
		40: 2100,
		60: 2200,
		80: 1800,
	};

	const monthOffset = Math.floor((encodedMonth - 1) / 20) * 20;
	const century = centuryOffsets[monthOffset];

	if (century === undefined) {
		return false;
	}

	const fullYear = century + year;
	const month = encodedMonth - monthOffset;

	return birthDate.getFullYear() === fullYear && birthDate.getMonth() + 1 === month && birthDate.getDate() === day;
};
