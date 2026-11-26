import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
	requestId: string;
	ipAddress: string | null;
	userAgent: string | null;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
	return requestContext.getStore();
}
