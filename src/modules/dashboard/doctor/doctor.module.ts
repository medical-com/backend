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
		router.post(
			"/dashboard/doctor/confirm-invitation",
			async (req, res) => await controller.confirmInvitation(req, res),
		);
		router.post("/dashboard/doctor/schedule/create", async (req, res) => await controller.createSchedule(req, res));
		router.post("/dashboard/doctor/schedule/update", async (req, res) => await controller.updateSchedule(req, res));
		router.get("/dashboard/doctor/schedule/list", async (req, res) => await controller.listSchedules(req, res));
		router.post(
			"/dashboard/doctor/schedule-exception/create",
			async (req, res) => await controller.createScheduleException(req, res),
		);
		router.post(
			"/dashboard/doctor/schedule-exception/update",
			async (req, res) => await controller.updateScheduleException(req, res),
		);
		router.post(
			"/dashboard/doctor/schedule-exception/delete",
			async (req, res) => await controller.deleteScheduleException(req, res),
		);
		router.get(
			"/dashboard/doctor/schedule-exception/list",
			async (req, res) => await controller.listScheduleExceptions(req, res),
		);

		this.modules.useRouter(router);
	}
}
