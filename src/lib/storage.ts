const MINIO_PUBLIC_BASE = sanitizeMinioBase(process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000");
const MINIO_BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET || "coffeeshop-files";

export function resolveStorageUrl(url?: string | null): string | undefined {
    if (!url) return undefined;

    const value = url.trim();
    if (!value) return undefined;

    if (value.startsWith("data:") || value.startsWith("blob:")) {
        return value;
    }

    const browserObjectUrl = normalizeBrowserObjectUrl(value);
    if (browserObjectUrl) {
        return browserObjectUrl;
    }

    if (value.startsWith("http://") || value.startsWith("https://")) {
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

function sanitizeMinioBase(value: string): string {
    const trimmed = value.trim().replace(/\/$/, "");
    if (!trimmed) return "http://localhost:9000";

    try {
        const parsed = new URL(trimmed);
        parsed.pathname = parsed.pathname.replace(/\/browser\/?$/, "").replace(/\/$/, "");
        parsed.search = "";
        parsed.hash = "";
        return parsed.toString().replace(/\/$/, "");
    } catch {
        return trimmed.replace(/\/browser\/?$/, "");
    }
}

function normalizeBrowserObjectUrl(value: string): string | undefined {
    try {
        const parsed = new URL(value);
        const browserPrefix = `/browser/${MINIO_BUCKET}/`;
        if (!parsed.pathname.startsWith(browserPrefix)) {
            return undefined;
        }

        const encodedObjectPath = parsed.pathname.slice(browserPrefix.length);
        const objectPath = decodeURIComponent(encodedObjectPath).replace(/^\/+/, "");
        if (!objectPath || objectPath.endsWith("/")) {
            return undefined;
        }

        return `${parsed.origin}/${MINIO_BUCKET}/${objectPath}`;
    } catch {
        return undefined;
    }
}
