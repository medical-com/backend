import { TZDate, tz } from "@date-fns/tz";
import {
	addDays,
	addHours,
	addMinutes,
	format,
	isSameDay,
	startOfDay,
	endOfDay,
	parseISO,
	isAfter as isAfterDateFns,
	isBefore as isBeforeDateFns,
	isEqual as isEqualDateFns,
} from "date-fns";
import { pl } from "date-fns/locale";
import { config } from "../config";

const timeZone = config.timeZone;
const context = tz(timeZone);

export const now = () => TZDate.tz(timeZone);
export const toLocal = (date: Date) => new TZDate(date, timeZone);
export const formatDate = (date: Date, pattern = "dd.MM.yyyy HH:mm") => format(toLocal(date), pattern, { locale: pl });
export const isBefore = (a: Date, b: Date): boolean => isBeforeDateFns(toLocal(a), toLocal(b));
export const isAfter = (a: Date, b: Date): boolean => isAfterDateFns(toLocal(a), toLocal(b));
export const isEqual = (a: Date, b: Date): boolean => isEqualDateFns(toLocal(a), toLocal(b));
export const dayStart = (date: Date) => startOfDay(date, { in: context });
export const dayEnd = (date: Date) => endOfDay(date, { in: context });
export const plusDays = (date: Date, days: number) => addDays(date, days, { in: context });
export const plusHours = (date: Date, hours: number) => addHours(date, hours, { in: context });
export const plusMinutes = (date: Date, minutes: number) => addMinutes(date, minutes, { in: context });
export const sameDay = (a: Date, b: Date) => isSameDay(a, b, { in: context });
export const fromISO = (value: string) => toLocal(parseISO(value));
export const calendarDate = (date: Date) => format(toLocal(date), "yyyy-MM-dd");
export const timeString = (date: Date) => format(toLocal(date), "HH:mm");
export const isoDayOfWeek = (date: Date) => toLocal(date).getDay() || 7;
export const withTime = (date: Date, time: string) => {
	const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);
	const localDate = toLocal(date);

	return TZDate.tz(
		timeZone,
		localDate.getFullYear(),
		localDate.getMonth(),
		localDate.getDate(),
		hours,
		minutes,
		seconds,
	);
};

export const excludeDates = (available: Date[], occupied: Date[]): Date[] => {
	const occupiedTimes = new Set(occupied.map((date) => date.getTime()));

	return available.filter((date) => !occupiedTimes.has(date.getTime()));
};
