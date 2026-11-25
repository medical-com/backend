import { socketManager } from "@/core/socket/socket-manager";
import { AppointmentStatus } from "@/database/types";

class DashboardAppointmentsGateway {
	statusChanged(data: { accountId: string; appointmentId: string; status: AppointmentStatus }) {
		socketManager.server.to(`account:${data.accountId}`).emit("appointment:statusChanged", {
			appointmentId: data.appointmentId,
			status: data.status,
		});
	}
}
export const dashboardAppointmentsGateway = new DashboardAppointmentsGateway();
