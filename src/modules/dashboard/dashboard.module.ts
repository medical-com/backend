import Modules from "..";
import DashboardDoctorModule from "./doctor/doctor.module";
import DashboardPatientModule from "./patient/patient.module";

import type { TypedRouter } from "@/types/api-paths.type";

export default class DashboardModule {
	readonly doctor: DashboardDoctorModule;
	readonly patient: DashboardPatientModule;

	constructor(readonly modules: Modules) {
		this.doctor = new DashboardDoctorModule(this);
		this.patient = new DashboardPatientModule(this);
	}

	useRouter(router: TypedRouter<any>) {
		this.modules.useRouter(router);
	}
}
