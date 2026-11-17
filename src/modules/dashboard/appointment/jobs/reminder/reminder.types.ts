export const QUEUE_NAME = "appointment-reminder-queue";

export type AppointmentReminderJobData = {
	appointmentId: string;
	reminderTime: number; // Unix timestamp
};
