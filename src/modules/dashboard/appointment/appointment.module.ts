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
		this.modules.useRouter(router);
	}
}
