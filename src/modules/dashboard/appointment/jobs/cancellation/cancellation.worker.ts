import { workerLogger } from "@/core/logger/worker.logger";
import { appointmentRepository } from "@/database/repositories";

const CANCELLATION_INTERVAL_MS = 60 * 1000;

export class AppointmentCancellationWorker {
	private readonly interval: NodeJS.Timeout;
	private running = false;

	constructor() {
		this.interval = setInterval(() => this.process(), CANCELLATION_INTERVAL_MS);

		workerLogger.info("Appointment cancellation worker started");

		this.process();
	}

	async process(): Promise<void> {
		if (this.running) return;

		this.running = true;
		try {
			const updatedCount = await appointmentRepository.cancelPastAppointments({
				pastAt: new Date(),
			});
			if (updatedCount > 0) workerLogger.info(`Cancelled ${updatedCount} past appointment(s)`);
		} catch (error) {
			workerLogger.error("Failed to cancel past appointments:", error);
		} finally {
			this.running = false;
		}
	}

	async close(): Promise<void> {
		clearInterval(this.interval);
		await this.process();
	}
}
