import { Appointment, DoctorSchedule, DoctorScheduleException } from "@/database/types";
import { dayEnd, dayStart, timeString } from "@/core/date";
import { mergeIntervals, subtractIntervals, TimeInterval } from "@/core/time-intervals";

export const listAvailableTimeIntervals = (
	schedule: TimeInterval[],
	additional: TimeInterval[],
	unavailable: TimeInterval[],
	blocked: TimeInterval[],
) => {
	const availableIntervals = mergeIntervals([...schedule, ...additional]);

	const unavailableIntervals = mergeIntervals([...unavailable, ...blocked]);

	const freeIntervals: TimeInterval[] = subtractIntervals(availableIntervals, unavailableIntervals);

	return {
		timeIntervals: freeIntervals.map((interval) => ({
			start: formatTime(interval.start),
			end: formatTime(interval.end),
		})),
	};
};

const time = (value: string): number => {
	const [hours = 0, minutes = 0] = value.split(":").map(Number);

	return hours * 60 + minutes;
};

const formatTime = (minutes: number): string => {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const scheduleToTimeIntervals = (schedule: DoctorSchedule): TimeInterval => {
	return {
		start: time(schedule.start_time),
		end: time(schedule.end_time),
	};
};

const dateToMinutes = (date: Date): number => time(timeString(date));

export const exceptionToTimeIntervals = (exception: DoctorScheduleException, date?: Date): TimeInterval => {
	const start = date
		? Math.max(exception.start_at.getTime(), dayStart(date).getTime())
		: exception.start_at.getTime();
	const end = date ? Math.min(exception.end_at.getTime(), dayEnd(date).getTime()) : exception.end_at.getTime();

	return {
		start: dateToMinutes(new Date(start)),
		end: dateToMinutes(new Date(end)),
	};
};

export const appointmentToTimeIntervals = (appointment: Appointment, date?: Date): TimeInterval => {
	const start = date
		? Math.max(appointment.start_at.getTime(), dayStart(date).getTime())
		: appointment.start_at.getTime();
	const end = date ? Math.min(appointment.end_at.getTime(), dayEnd(date).getTime()) : appointment.end_at.getTime();

	return {
		start: dateToMinutes(new Date(start)),
		end: dateToMinutes(new Date(end)),
	};
};
