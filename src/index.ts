import { app } from "@/app";
import { config } from "@/core/config";
import { FileLogger } from "@/core/logger";

const logger = new FileLogger("server.log");

app.listen(config.port, () => {
	console.warn(`Server listening on port ${config.port}`);

	logger.info(`Server started on port ${config.port}`);
});
