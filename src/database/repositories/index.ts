import { AccountRepository } from "./account.repository";
import { DoctorRepository } from "./doctor.repository";
import { DoctorScheduleRepository } from "./doctor-schedule.repository";
import { DoctorScheduleExceptionRepository } from "./doctor-schedule-exception.repository";
import { PatientRepository } from "./patient.repository";
import { PersonRepository } from "./person.repository";

export const accountRepository = new AccountRepository();
export const doctorRepository = new DoctorRepository();
export const doctorScheduleRepository = new DoctorScheduleRepository();
export const doctorScheduleExceptionRepository = new DoctorScheduleExceptionRepository();
export const patientRepository = new PatientRepository();
export const personRepository = new PersonRepository();
