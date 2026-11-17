import { AccountRepository } from "./account.repository";
import { AppointmentRepository } from "./appointment.repository";
import { DoctorRepository } from "./doctor.repository";
import { DoctorScheduleRepository } from "./doctor-schedule.repository";
import { DoctorScheduleExceptionRepository } from "./doctor-schedule-exception.repository";
import { PatientRepository } from "./patient.repository";
import { PersonRepository } from "./person.repository";
import { ServiceRepository } from "./service.repository";

export const accountRepository = new AccountRepository();
export const appointmentRepository = new AppointmentRepository();
export const doctorRepository = new DoctorRepository();
export const doctorScheduleRepository = new DoctorScheduleRepository();
export const doctorScheduleExceptionRepository = new DoctorScheduleExceptionRepository();
export const patientRepository = new PatientRepository();
export const personRepository = new PersonRepository();
export const serviceRepository = new ServiceRepository();
