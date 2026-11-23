import { server } from "@/server";
import { config } from "@/core/config";
import { FileLogger } from "@/core/logger";

const logger = new FileLogger("server.log");

server.listen(config.port, () => {
	console.warn(`Server listening on port ${config.port}`);

	logger.info(`Server started on port ${config.port}`);
});
