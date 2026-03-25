export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class RequestError extends Error {
	public readonly status: number;
	public readonly data: unknown;

	constructor(message: string, status: number, data: unknown) {
		super(message);
		this.name = "RequestError";
		this.status = status;
		this.data = data;
	}
}

export class Request {
	private fetchImpl?: FetchLike;

	constructor(fetchImpl?: FetchLike) {
		this.fetchImpl = fetchImpl;
	}

	public createFetch(fetchImpl: FetchLike) {
		this.fetchImpl = fetchImpl;
	}

	public async request<T = unknown>(opts: {
		method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
		url: string;
		headers?: Record<string, string>;
		body?: unknown;
	}): Promise<T> {
		if (!this.fetchImpl) {
			throw new Error("Fetch instance not initialized. Call request.createFetch(fetch) first.");
		}

		const res = await this.fetchImpl(opts.url, {
			method: opts.method,
			headers: {
				...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
				...(opts.headers ?? {}),
			},
			body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
		});

		const data = (await res.json()) as unknown;

		if (!res.ok) {
			throw new RequestError(`HTTP ${res.status} ${res.statusText}`, res.status, data);
		}

		return data as T;
	}

	public get<T = unknown>(url: string, headers?: Record<string, string>) {
		return this.request<T>({ method: "GET", url, headers });
	}

	public post<T = unknown>(url: string, body?: unknown, headers?: Record<string, string>) {
		return this.request<T>({ method: "POST", url, body, headers });
	}

	public put<T = unknown>(url: string, body?: unknown, headers?: Record<string, string>) {
		return this.request<T>({ method: "PUT", url, body, headers });
	}

	public delete<T = unknown>(url: string, headers?: Record<string, string>) {
		return this.request<T>({ method: "DELETE", url, headers });
	}

	public patch<T = unknown>(url: string, body?: unknown, headers?: Record<string, string>) {
		return this.request<T>({ method: "PATCH", url, body, headers });
	}
}
