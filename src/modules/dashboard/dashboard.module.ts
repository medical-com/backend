import Modules from "..";
import DashboardDoctorModule from "./doctor/doctor.module";
import DashboardPatientModule from "./patient/patient.module";
import DashboardServiceModule from "./service/service.module";

import type { TypedRouter } from "@/types/api-paths.type";

export default class DashboardModule {
	readonly doctor: DashboardDoctorModule;
	readonly patient: DashboardPatientModule;
	readonly service: DashboardServiceModule;

	constructor(readonly modules: Modules) {
		this.doctor = new DashboardDoctorModule(this);
		this.patient = new DashboardPatientModule(this);
		this.service = new DashboardServiceModule(this);
	}

	useRouter(router: TypedRouter<any>) {
		this.modules.useRouter(router);
	}
}
