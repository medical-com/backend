import type express from "express";

import AuthModule from "./auth/auth.module";
import HealthModule from "./health/health.module";
import DashboardModule from "./dashboard/dashboard.module";

import type { TypedRouter } from "@/types/api-paths.type";

export default class Modules {
	app: express.Express;

	healthModule: HealthModule;
	authModule: AuthModule;

	dashboardModule: DashboardModule;

	constructor(app: express.Express) {
		this.app = app;

		this.healthModule = new HealthModule(this);
		this.authModule = new AuthModule(this);

		this.dashboardModule = new DashboardModule(this);
	}

	useRouter(router: TypedRouter<any>) {
		this.app.use("/api", router);
	}
}
