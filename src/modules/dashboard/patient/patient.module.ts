import express from "express";
import DashboardModule from "../dashboard.module";

import { TypedRouter } from "@/types/api-paths.type";
import { DashboardPatientPaths } from "./types/patient.types";
import { dashboardPatientController as controller } from "./patient.controller";

const router = express.Router() as TypedRouter<DashboardPatientPaths>;
export default class DashboardPatientModule {
	constructor(readonly modules: DashboardModule) {
		router.get("/dashboard/patient/find-one", async (req, res) => await controller.findOne(req, res));
		router.get("/dashboard/patient/list", async (req, res) => await controller.list(req, res));

		this.modules.useRouter(router);
	}
}
