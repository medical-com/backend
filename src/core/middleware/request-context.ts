import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import type { RequestHandler } from "express";

import { requestContext } from "@/core/context/request-context";

export const attachRequestContext: RequestHandler = (req, res, next) => {
	const requestId = randomUUID();
	const ip = req.ip;

	res.setHeader("X-Request-ID", requestId);

	requestContext.run(
		{
			requestId,
			ipAddress: ip && isIP(ip) ? ip : null,
			userAgent: req.get("user-agent")?.slice(0, 1024) ?? null,
		},
		() => next(),
	);
};
