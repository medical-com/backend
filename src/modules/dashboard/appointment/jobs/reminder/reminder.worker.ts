import { Worker } from "bullmq";
import { workerRedis } from "@/core/mq";
import { QUEUE_NAME, type AppointmentReminderJobData } from "./reminder.types";
import { AppointmentStatus } from "@/database/types";
import { workerLogger } from "@/core/logger/worker.logger";
import { sendAppointmentReminderEmail } from "@/core/mail/appointment.mail";
import { appointmentRepository } from "@/database/repositories";

export class AppointmentReminderWorker {
	private readonly worker: Worker<AppointmentReminderJobData>;

	constructor() {
		this.worker = new Worker<AppointmentReminderJobData>(QUEUE_NAME, (job) => this.processJob(job.data), {
			connection: workerRedis,
		});

		workerLogger.info("Appointment reminder worker started");

		this.worker.on("error", (error) => {
			console.error("Appointment reminder worker error:", error);
		});

		this.worker.on("failed", (job, error) => {
			console.error("Appointment reminder job failed:", job?.id, error);
		});
	}

	private async processJob(data: AppointmentReminderJobData) {
		workerLogger.info(
			`Processing appointment reminder for ${data.appointmentId} at ${new Date(data.reminderTime).toISOString()}`,
		);

		const appointment = await appointmentRepository.findDetailedById({ id: data.appointmentId });
		if (!appointment) {
			workerLogger.error(`Appointment not found for reminder: ${data.appointmentId}`);
			return;
		}

		if (appointment.status !== AppointmentStatus.SCHEDULED && appointment.status !== AppointmentStatus.CONFIRMED) {
			workerLogger.info(
				`Skipping reminder for appointment ${data.appointmentId} because its status is ${appointment.status}`,
			);
			return;
		}

		await sendAppointmentReminderEmail({
			firstName: appointment.patient.firstName,
			lastName: appointment.patient.lastName,
			email: appointment.patient.email,
			date: new Date(appointment.startAt),
			serviceName: appointment.service.name,
			duration: appointment.service.duration,
			doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
		});
	}

	close(): Promise<void> {
		return this.worker.close();
	}
}
