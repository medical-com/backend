import type express from "express";

import AuthModule from "./auth/auth.module";
import HealthModule from "./health/health.module";

import type { TypedRouter } from "@/types/api-paths.type";

export default class Modules {
	app: express.Express;

	healthModule: HealthModule;
	authModule: AuthModule;

	constructor(app: express.Express) {
		this.app = app;

		this.healthModule = new HealthModule(this);
		this.authModule = new AuthModule(this);
	}

	useRouter(router: TypedRouter<any>) {
		this.app.use("/api", router);
	}
}
