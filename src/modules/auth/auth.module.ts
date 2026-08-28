import express from "express";

import type Modules from "..";
import AuthController from "./auth.controller";
import AuthService from "./auth.service";

import type { TypedRouter } from "@/types/api-paths.type";
import type { AuthPaths } from "./types/auth.types";

const router = express.Router() as TypedRouter<AuthPaths>;
export default class AuthModule {
	constructor(readonly modules: Modules) {
		const service = new AuthService(this.modules.userRepository);
		const controller = new AuthController(service);

		router.post("/auth/register", (req, res) => controller.onRegister(req, res));
		router.post("/auth/login", (req, res) => controller.onLogin(req, res));
		router.post("/auth/logout", (req, res) => controller.onLogout(req, res));
		router.get("/auth/me", (req, res) => controller.onMe(req, res));

		this.modules.useRouter(router);
	}
}
