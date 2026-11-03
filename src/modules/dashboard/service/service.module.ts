import express from "express";
import DashboardModule from "../dashboard.module";
import DashboardServiceController from "./service.controller";
import type { TypedRouter } from "@/types/api-paths.type";
import type { DashboardServicePaths } from "./types/service.types";

const router = express.Router() as TypedRouter<DashboardServicePaths>;

export default class DashboardServiceModule {
	constructor(readonly modules: DashboardModule) {
		const controller = new DashboardServiceController();

		router.get("/dashboard/service/find-one", async (req, res) => await controller.findOne(req, res));
		router.get("/dashboard/service/list", async (req, res) => await controller.list(req, res));
		router.post("/dashboard/service/create", async (req, res) => await controller.create(req, res));
		router.post("/dashboard/service/update", async (req, res) => await controller.update(req, res));
		router.post("/dashboard/service/delete", async (req, res) => await controller.delete(req, res));

		this.modules.useRouter(router);
	}
}
