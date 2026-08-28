import { config } from "@/core/config";
import Redis from "ioredis";

const redis = new Redis(config.redis.url);

redis.on("error", (error) => {
	console.error("Redis error:", error);
});

export default redis;
