import { workerLogger } from "@/core/logger/worker.logger";
import { AppointmentReminderWorker } from "./reminder/reminder.worker";
import { AppointmentCancellationWorker } from "./cancellation/cancellation.worker";

export class AppointmentWorker {
	private readonly reminderWorker: AppointmentReminderWorker;
	private readonly cancellationWorker: AppointmentCancellationWorker;

	constructor() {
		this.reminderWorker = new AppointmentReminderWorker();
		this.cancellationWorker = new AppointmentCancellationWorker();

		workerLogger.info("Appointment worker initialized");
	}

	async closeAll(): Promise<void> {
		workerLogger.info("Closing appointment workers...");
		const results = await Promise.allSettled([this.reminderWorker.close(), this.cancellationWorker.close()]);

		const errors = results.flatMap((result) => (result.status === "rejected" ? [result.reason] : []));

		if (errors.length > 0) throw new AggregateError(errors, "Failed to close appointment workers");
	}
}
