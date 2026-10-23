import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface Logger {
	trace(message: string, data?: unknown): void;
	debug(message: string, data?: unknown): void;
	info(message: string, data?: unknown): void;
	warn(message: string, data?: unknown): void;
	error(message: string, data?: unknown): void;
	fatal(message: string, data?: unknown): void;
}

export class FileLogger implements Logger {
	constructor(private readonly fileName: string) {
		mkdirSync(dirname(fileName), { recursive: true });
	}

	trace(message: string, data?: unknown): void {
		this.write("TRACE", message, data);
	}

	debug(message: string, data?: unknown): void {
		this.write("DEBUG", message, data);
	}

	info(message: string, data?: unknown): void {
		this.write("INFO", message, data);
	}

	warn(message: string, data?: unknown): void {
		this.write("WARN", message, data);
	}

	error(message: string, data?: unknown): void {
		this.write("ERROR", message, data);
	}

	fatal(message: string, data?: unknown): void {
		this.write("FATAL", message, data);
	}

	private write(level: LogLevel, message: string, data?: unknown): void {
		const timestamp = new Date().toISOString();

		const extra = data !== undefined ? ` ${this.stringify(data)}` : "";

		const line = `[${timestamp}] [${level}] ${message}${extra}\n`;

		appendFileSync(this.fileName, line, "utf8");
	}

	private stringify(data: unknown): string {
		if (data instanceof Error) {
			return JSON.stringify({
				name: data.name,
				message: data.message,
				stack: data.stack,
			});
		}

		try {
			return JSON.stringify(data);
		} catch {
			return "[Unable to serialize log data]";
		}
	}
}
