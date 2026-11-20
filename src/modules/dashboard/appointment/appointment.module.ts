import express from "express";

import DashboardModule from "../dashboard.module";
import { TypedRouter } from "@/types/api-paths.type";
import { DashboardAppointmentPaths } from "./types/appointment.types";
import { dashboardAppointmentController as controller } from "./appointment.controller";

const router = express.Router() as TypedRouter<DashboardAppointmentPaths>;

export default class DashboardAppointmentModule {
	constructor(readonly modules: DashboardModule) {
		router.get(
			"/dashboard/appointment/available-dates",
			async (req, res) => await controller.listAvailableDates(req, res),
		);
		router.post("/dashboard/appointment", async (req, res) => await controller.create(req, res));
		router.get("/dashboard/appointment/list", async (req, res) => await controller.list(req, res));
		router.get("/dashboard/appointment/find-one", async (req, res) => await controller.findOne(req, res));
		router.patch(
			"/dashboard/appointment/update-status",
			async (req, res) => await controller.updateStatus(req, res),
		);
		router.post(
			"/dashboard/appointment/medical-record/create",
			async (req, res) => await controller.createMedicalRecord(req, res),
		);
		router.patch(
			"/dashboard/appointment/medical-record/update",
			async (req, res) => await controller.updateMedicalRecord(req, res),
		);
		router.get(
			"/dashboard/appointment/medical-record/find-one",
			async (req, res) => await controller.findOneMedicalRecord(req, res),
		);
		router.get(
			"/dashboard/appointment/medical-record/list",
			async (req, res) => await controller.listMedicalRecords(req, res),
		);

		this.modules.useRouter(router);
	}
}
