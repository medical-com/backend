import type express from "express";
import type { TypedRouter } from "@/types/api-paths.type";
import AuthModule from "./auth/auth.module";
import HealthModule from "./health/health.module";
import AccountRepository from "@/database/repositories/account.repository";
import PatientRepository from "@/database/repositories/patient.repository";

export default class Modules {
	app: express.Express;

	accountRepository: AccountRepository;
	patientRepository: PatientRepository;

	healthModule: HealthModule;
	authModule: AuthModule;

	constructor(app: express.Express) {
		this.app = app;

		this.accountRepository = new AccountRepository();
		this.patientRepository = new PatientRepository();

		this.healthModule = new HealthModule(this);
		this.authModule = new AuthModule(this);
	}

	useRouter(router: TypedRouter<any>) {
		this.app.use("/api", router);
	}
}
