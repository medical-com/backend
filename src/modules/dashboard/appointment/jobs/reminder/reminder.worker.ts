import { Worker } from "bullmq";
import { workerRedis } from "@/core/mq";
import { QUEUE_NAME, type AppointmentReminderJobData } from "./reminder.types";
import { dashboardAppointmentService } from "../../appointment.service";
import { AppointmentStatus } from "@/database/types";
import { workerLogger } from "@/core/logger/worker.logger";

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

		await dashboardAppointmentService.updateStatus({ id: data.appointmentId, status: AppointmentStatus.NO_SHOW });
	}

	close(): Promise<void> {
		return this.worker.close();
	}
}
