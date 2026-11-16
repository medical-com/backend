import Redis from "ioredis";

import { QueueBaseOptions, QueueOptions } from "bullmq";
import { config } from "@/core/config";

export const workerRedis = new Redis(config.redis.url, {
	maxRetriesPerRequest: null,
});

workerRedis.on("error", (error) => {
	console.error("Worker Redis error:", error);
});

export const mqDefaultOpts: QueueBaseOptions = {
	connection: workerRedis,
};

export const queueDefaultOpts: QueueOptions = {
	...mqDefaultOpts,
	defaultJobOptions: {
		removeOnComplete: 100,
		removeOnFail: 100,
	},
};
