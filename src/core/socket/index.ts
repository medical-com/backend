import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { config } from "@/core/config";
import { registerSocketAuth } from "@/core/middleware/socket-auth";
import { FileLogger } from "@/core/logger";

const logger = new FileLogger("socket.log");

export const createSocketServer = (httpServer: HttpServer) => {
	logger.info("Creating socket server...");
	const io = new Server(httpServer, {
		cors: {
			origin: config.clientUrl,
			credentials: true,
		},
	});

	registerSocketAuth(io);

	io.on("connection", async (socket) => {
		const account = socket.data.account;

		await socket.join(`account:${account.id}`);
		logger.info(`Account ${account.id} connected`);

		socket.on("disconnect", () => {
			logger.info(`Account ${account.id} disconnected`);
		});
	});

	logger.info("Socket server created and authentication middleware registered");

	return io;
};
