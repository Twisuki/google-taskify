import Undici from "undici";

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
	private _tokenGetter?: () => string | undefined;

	public setTokenGetter(getter: () => string | undefined): void {
		this._tokenGetter = getter;
	}

	private async getToken(): Promise<string | undefined> {
		return this._tokenGetter?.();
	}

	public async request<T = unknown>(opts: {
		method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
		url: string;
		headers?: Record<string, string>;
		body?: unknown;
	}): Promise<T> {
		const token = await this.getToken();

		const headers: Record<string, string> = {
			...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
			...(opts.headers ?? {}),
		};
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		const { statusCode, statusText, body } = await Undici.request(opts.url, {
			method: opts.method,
			headers,
			body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
		});

		const text = await body.text();
		if (statusCode < 200 || statusCode >= 300) {
			let data: unknown;
			try {
				data = JSON.parse(text);
			} catch {
				data = text;
			}
			throw new RequestError(`HTTP ${statusCode} ${statusText}`, statusCode, data);
		}

		if (!text) {
			return undefined as T;
		}
		return JSON.parse(text) as T;
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
