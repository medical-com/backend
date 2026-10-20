import Modules from "..";
import DashboardPatientModule from "./patient/patient.module";

import type { TypedRouter } from "@/types/api-paths.type";

export default class DashboardModule {
	readonly patient: DashboardPatientModule;

	constructor(readonly modules: Modules) {
		this.patient = new DashboardPatientModule(this);
	}

	useRouter(router: TypedRouter<any>) {
		this.modules.useRouter(router);
	}
}
