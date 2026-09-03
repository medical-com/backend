import type express from "express";
import type { TypedRouter } from "@/types/api-paths.type";
import AuthModule from "./auth/auth.module";
import HealthModule from "./health/health.module";
import AccountRepository from "@/database/repositories/account.repository";
import PersonRepository from "@/database/repositories/person.repository";

export default class Modules {
	app: express.Express;

	accountRepository: AccountRepository;
	personRepository: PersonRepository;

	healthModule: HealthModule;
	authModule: AuthModule;

	constructor(app: express.Express) {
		this.app = app;

		this.accountRepository = new AccountRepository();
		this.personRepository = new PersonRepository();

		this.healthModule = new HealthModule(this);
		this.authModule = new AuthModule(this);
	}

	useRouter(router: TypedRouter<any>) {
		this.app.use("/api", router);
	}
}
