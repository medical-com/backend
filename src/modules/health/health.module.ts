import express from "express";

import type { TypedRouter } from "@/types/api-paths.type";
import type { HealthPaths } from "./health.types";

import type Modules from "..";
import HealthController from "./health.controller";
import HealthService from "./health.service";

const router = express.Router() as TypedRouter<HealthPaths>;
export default class HealthModule {
	constructor(readonly modules: Modules) {
		const controller = new HealthController(new HealthService());

		router.get("/health/status", (req, res) => controller.getStatus(req, res));
		router.get("/health/error", (req, res) => controller.throwExample(req, res));

		this.modules.useRouter(router);
	}
}
