import express from "express";

import DashboardModule from "../dashboard.module";
import DashboardDoctorController from "./doctor.controller";

import type { DashboardDoctorPaths } from "./types/doctor.types";
import type { TypedRouter } from "@/types/api-paths.type";

const router = express.Router() as TypedRouter<DashboardDoctorPaths>;
export default class DashboardDoctorModule {
	constructor(readonly modules: DashboardModule) {
		const controller = new DashboardDoctorController();

		router.get("/dashboard/doctor/find-one", async (req, res) => await controller.findOne(req, res));
		router.get("/dashboard/doctor/list", async (req, res) => await controller.list(req, res));
		router.post("/dashboard/doctor/update", async (req, res) => await controller.update(req, res));
		router.post("/dashboard/doctor/create", async (req, res) => await controller.create(req, res));
		router.post("/dashboard/doctor/confirm-invitation", async (req, res) => await controller.confirmInvitation(req, res));

		this.modules.useRouter(router);
	}
}
