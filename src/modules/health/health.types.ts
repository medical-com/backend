import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	status: "/health/status",
	error: "/health/error",
} as const;
export type HealthPaths = Flatten<typeof paths>;
