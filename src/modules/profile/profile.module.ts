import express from "express";

import Modules from "..";
import { ProfilePaths } from "./types/profile.types";
import { TypedRouter } from "@/types/api-paths.type";
import { profileController } from "./profile.controller";

const router = express.Router() as TypedRouter<ProfilePaths>;

export default class ProfileModule {
	constructor(readonly modules: Modules) {
		router.get(
			"/profile/appointments/find-one",
			async (req, res) => await profileController.findOneAppointment(req, res),
		);
		router.get("/profile/appointments", async (req, res) => await profileController.listAppointments(req, res));
		router.patch(
			"/profile/appointments/cancel",
			async (req, res) => await profileController.cancelAppointment(req, res),
		);
		this.modules.useRouter(router);
	}
}
