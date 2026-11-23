import type { Server } from "socket.io";

class SocketManager {
	private io?: Server;

	initialize(io: Server) {
		if (this.io) throw new Error("SocketManager already initialized");

		this.io = io;
	}

	get server(): Server {
		if (!this.io) throw new Error("Socket.IO not initialized");

		return this.io;
	}
}

export const socketManager = new SocketManager();
