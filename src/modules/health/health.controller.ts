import type express from "express";
import type HealthService from "./health.service";

import { AppError } from "@/core/errors/app-error";

export default class HealthController {
	constructor(readonly service: HealthService) {}

	getStatus(_req: express.Request, res: express.Response) {
		return res.json({ status: this.service.health() });
	}

	throwExample(_req: express.Request, _res: express.Response) {
		throw new AppError("Example error", 404);
	}
}
