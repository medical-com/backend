import { Queue } from "bullmq";
import { queueDefaultOpts } from "@/core/mq";
import { QUEUE_NAME, AppointmentReminderJobData } from "./reminder.types";
import { workerLogger } from "@/core/logger/worker.logger";

class AppointmentReminderQueue {
	private readonly queue = new Queue<AppointmentReminderJobData>(QUEUE_NAME, queueDefaultOpts);

	private getJobId(appointmentId: string) {
		return `appointment-reminder-${encodeURIComponent(appointmentId)}`;
	}

	add(data: { appointmentId: string; reminderTime: Date }) {
		const { appointmentId, reminderTime } = data;
		const runAt = reminderTime.getTime();

		if (!Number.isFinite(runAt)) throw new Error("Invalid reminderTime");
		workerLogger.info(
			`Scheduling appointment reminder for appointment ${appointmentId} at ${reminderTime.toISOString()}`,
		);

		return this.queue.add(
			"appointment-reminder-job",
			{ appointmentId, reminderTime: runAt },
			{
				jobId: this.getJobId(appointmentId),
				delay: Math.max(0, runAt - Date.now()),
			},
		);
	}

	async cancel(data: { appointmentId: string }): Promise<boolean> {
		const removed = await this.queue.remove(this.getJobId(data.appointmentId));

		if (removed === 0)
			workerLogger.info(
				`Cannot cancel appointment reminder: No reminder found for appointment ${data.appointmentId}`,
			);
		else workerLogger.info(`Cancelled appointment reminder for appointment ${data.appointmentId}`);

		return removed === 1;
	}

	getQueue() {
		return this.queue;
	}
}

export const appointmentReminderQueue = new AppointmentReminderQueue();
