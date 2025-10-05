/**
 * Shared types for Cloudflare Worker
 */

// Cloudflare Worker runtime types
interface R2Bucket {
	get(key: string): Promise<R2ObjectBody | null>;
	put(
		key: string,
		value: ReadableStream | ArrayBuffer | string,
		options?: R2PutOptions,
	): Promise<R2Object>;
	delete(key: string): Promise<void>;
	list(options?: R2ListOptions): Promise<R2Objects>;
}

interface R2Object {
	key: string;
	size: number;
	etag: string;
	httpEtag: string;
}

interface R2ObjectBody extends R2Object {
	body: ReadableStream;
	bodyUsed: boolean;
	arrayBuffer(): Promise<ArrayBuffer>;
	text(): Promise<string>;
	json<T = unknown>(): Promise<T>;
	blob(): Promise<Blob>;
}

interface R2PutOptions {
	httpMetadata?: {
		contentType?: string;
		contentLanguage?: string;
		contentDisposition?: string;
		contentEncoding?: string;
		cacheControl?: string;
		cacheExpiry?: Date;
	};
	customMetadata?: Record<string, string>;
}

interface R2ListOptions {
	prefix?: string;
	delimiter?: string;
	cursor?: string;
	limit?: number;
}

interface R2Objects {
	objects: R2Object[];
	truncated: boolean;
	cursor?: string;
	delimitedPrefixes: string[];
}

interface KVNamespace {
	get(
		key: string,
		options?: { type?: "text" | "json" | "arrayBuffer" | "stream" },
	): Promise<unknown>;
	put(
		key: string,
		value: string | ArrayBuffer | ReadableStream,
		options?: {
			expirationTtl?: number;
			expiration?: number;
			metadata?: unknown;
		},
	): Promise<void>;
	delete(key: string): Promise<void>;
	list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
		keys: { name: string; expiration?: number; metadata?: unknown }[];
		list_complete: boolean;
		cursor?: string;
	}>;
}

interface DurableObjectNamespace {
	idFromName(name: string): DurableObjectId;
	idFromString(id: string): DurableObjectId;
	get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {
	toString(): string;
	equals(other: DurableObjectId): boolean;
}

interface DurableObjectStub {
	fetch(request: Request): Promise<Response>;
}

interface AnalyticsEngineDataset {
	writeDataPoint(event?: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

export interface Env {
	GENOMICS_DATA: R2Bucket;
	METADATA_CACHE: KVNamespace;
	ANALYTICS_PROCESSOR?: DurableObjectNamespace;
	ANALYTICS?: AnalyticsEngineDataset;
	ENVIRONMENT: string;
	LOG_LEVEL: string;
}
