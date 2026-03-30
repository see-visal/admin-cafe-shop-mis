const MINIO_PUBLIC_BASE = (process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000").replace(/\/$/, "");
const MINIO_BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET || "coffeeshop-files";

export function resolveStorageUrl(url?: string | null): string | undefined {
    if (!url) return undefined;

    const value = url.trim();
    if (!value) return undefined;

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:") ||
        value.startsWith("blob:")
    ) {
        return value;
    }

    if (value.startsWith("/")) {
        return value;
    }

    const normalized = value.replace(/^\/+/, "");

    if (normalized.startsWith(`${MINIO_BUCKET}/`)) {
        return `${MINIO_PUBLIC_BASE}/${normalized}`;
    }

    return `${MINIO_PUBLIC_BASE}/${MINIO_BUCKET}/${normalized}`;
}

export function isRemoteStorageUrl(url?: string): boolean {
    return Boolean(url && (url.startsWith("http://") || url.startsWith("https://")));
}
