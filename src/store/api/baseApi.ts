// ============================================================
// Admin — RTK Query Base API
// src/store/api/baseApi.ts
// ============================================================
import {
    createApi,
    fetchBaseQuery,
    type BaseQueryFn,
    type FetchArgs,
    type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { clearCredentials } from "@/store/slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token) headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithAdminAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions,
) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
        api.dispatch(clearCredentials());
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: "adminApi",
    baseQuery: baseQueryWithAdminAuth,
    tagTypes: [
        "Dashboard",
        "Order",
        "Product",
        "Ingredient",
        "User",
        "AuditLog",
        "Category",
        "Payment",
        "Promo",
        "Report",
        "Loyalty",
        "Rating",
        "Notification",
    ],
    endpoints: () => ({}),
});
