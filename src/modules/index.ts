import type express from "express";
import UserRepository from "@/database/repositories/user.repository";
import type { TypedRouter } from "@/types/api-paths.type";
import AuthModule from "./auth/auth.module";
import HealthModule from "./health/health.module";

export default class Modules {
	app: express.Express;

	userRepository: UserRepository;

	healthModule: HealthModule;
	authModule: AuthModule;

	constructor(app: express.Express) {
		this.app = app;

		this.userRepository = new UserRepository();

		this.healthModule = new HealthModule(this);
		this.authModule = new AuthModule(this);
	}

	useRouter(router: TypedRouter<any>) {
		this.app.use("/api", router);
	}
}
