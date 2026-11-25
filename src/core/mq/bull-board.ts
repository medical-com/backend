import type { Express } from "express";
import basicAuth from "express-basic-auth";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { config } from "@/core/config";
import { appointmentReminderQueue } from "@/modules/dashboard/appointment/jobs/reminder/reminder.queue";

export function setupBullBoard(app: Express) {
	const { username, password } = config.bullBoard;
	if (!username || !password) return;

	const basePath = "/admin/queues";

	const serverAdapter = new ExpressAdapter();
	serverAdapter.setBasePath(basePath);

	createBullBoard({
		queues: [
			new BullMQAdapter(appointmentReminderQueue.getQueue(), {
				readOnlyMode: config.env === "production",
			}),
		],
		serverAdapter,
	});

	app.use(
		basePath,
		basicAuth({
			users: {
				[username]: password,
			},
			challenge: true,
		}),
		serverAdapter.getRouter(),
	);
}
