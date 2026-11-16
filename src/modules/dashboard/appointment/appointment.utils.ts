import { AppointmentStatus } from "@/database/types";
import type { Appointment, DoctorSchedule, DoctorScheduleException } from "@/database/types";
import { dayEnd, dayStart, timeString } from "@/core/date";
import { mergeIntervals, subtractIntervals } from "@/core/time-intervals";
import type { TimeInterval } from "@/core/time-intervals";

export function blocksAvailability({ status }: Appointment): boolean {
	return status !== AppointmentStatus.CANCELLED && status !== AppointmentStatus.NO_SHOW;
}

function toMinutes(value: string): number {
	const [hours = 0, minutes = 0] = value.split(":").map(Number);
	return hours * 60 + minutes;
}

function formatTime(totalMinutes: number): string {
	const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
	const minutes = String(totalMinutes % 60).padStart(2, "0");
	return `${hours}:${minutes}`;
}

function getFreeIntervals(
	schedule: TimeInterval[],
	additional: TimeInterval[],
	unavailable: TimeInterval[],
	blocked: TimeInterval[],
): TimeInterval[] {
	return subtractIntervals(
		mergeIntervals([...schedule, ...additional]),
		mergeIntervals([...unavailable, ...blocked]),
	);
}

export function listAvailableTimeIntervals(
	schedule: TimeInterval[],
	additional: TimeInterval[],
	unavailable: TimeInterval[],
	blocked: TimeInterval[],
) {
	return {
		timeIntervals: getFreeIntervals(schedule, additional, unavailable, blocked).map(({ start, end }) => ({
			start: formatTime(start),
			end: formatTime(end),
		})),
	};
}

export function listAvailableSlots(
	schedule: TimeInterval[],
	additional: TimeInterval[],
	unavailable: TimeInterval[],
	blocked: TimeInterval[],
	durationMinutes: number,
): string[] {
	if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
		throw new RangeError("Service duration must be a positive integer");
	}

	const slots = new Set<string>();
	for (const { start, end } of getFreeIntervals(schedule, additional, unavailable, blocked)) {
		for (let minute = start; minute + durationMinutes <= end; minute += durationMinutes) {
			slots.add(formatTime(minute));
		}
	}
	return [...slots];
}

export function scheduleToTimeIntervals(schedule: DoctorSchedule): TimeInterval {
	return { start: toMinutes(schedule.start_time), end: toMinutes(schedule.end_time) };
}

function dateRangeToTimeInterval(startAt: Date, endAt: Date, date?: Date): TimeInterval {
	const start = date ? new Date(Math.max(startAt.getTime(), dayStart(date).getTime())) : startAt;
	const end = date ? new Date(Math.min(endAt.getTime(), dayEnd(date).getTime())) : endAt;
	return { start: toMinutes(timeString(start)), end: toMinutes(timeString(end)) };
}

export function exceptionToTimeIntervals(exception: DoctorScheduleException, date?: Date): TimeInterval {
	return dateRangeToTimeInterval(exception.start_at, exception.end_at, date);
}

export function appointmentToTimeIntervals(appointment: Appointment, date?: Date): TimeInterval {
	return dateRangeToTimeInterval(appointment.start_at, appointment.end_at, date);
}
