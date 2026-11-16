import { AppointmentWorker } from "@/modules/dashboard/appointment/jobs/appointment.worker";
import { workerRedis } from "@/core/mq";
import { workerLogger } from "@/core/logger/worker.logger";

workerLogger.info("Starting appointment worker...");

const appointmentWorker = new AppointmentWorker();

let shuttingDown = false;
async function shutdown() {
	if (shuttingDown) return;
	shuttingDown = true;
	workerLogger.info("Shutting down appointment worker...");

	try {
		await appointmentWorker.closeAll();
	} catch (error) {
		workerLogger.error("Failed to close reminder worker:", error);
		process.exitCode = 1;
	} finally {
		workerRedis.disconnect();
	}
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
