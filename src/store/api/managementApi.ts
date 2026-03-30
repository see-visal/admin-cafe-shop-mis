// ============================================================
// Admin — Users, Audit, Promo, Loyalty, Reports & Ratings API
// src/store/api/managementApi.ts
// ============================================================
import { baseApi } from "./baseApi";
import type {
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    AdminUser,
    AuditLog,
    LoyaltyOverview,
    PageResponse,
    ProductRating,
    PromoCode,
    PromoCodeRequest,
    SettlementReport,
} from "@/types";

export const managementApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ── Users ───────────────────────────────────────────────
        getUsers: builder.query<PageResponse<AdminUser>, { page?: number; size?: number; roles?: string[] }>({
            query: ({ page = 0, size = 20, roles } = {}) => ({
                url: "/api/admin/users",
                params: {
                    page,
                    size,
                    ...(roles && roles.length > 0 ? { roles: roles.join(",") } : {}),
                },
            }),
            providesTags: ["User"],
        }),

        createUser: builder.mutation<AdminUser, AdminCreateUserRequest>({
            query: (body) => ({ url: "/api/admin/users", method: "POST", body }),
            invalidatesTags: ["User", "AuditLog"],
        }),

        updateUser: builder.mutation<AdminUser, { uuid: string; body: AdminUpdateUserRequest }>({
            query: ({ uuid, body }) => ({
                url: `/api/admin/users/${uuid}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["User", "AuditLog"],
        }),

        setUserEnabled: builder.mutation<AdminUser, { uuid: string; enabled: boolean }>({
            query: ({ uuid, enabled }) => ({
                url: `/api/admin/users/${uuid}/enable`,
                method: "PATCH",
                params: { enabled },
            }),
            invalidatesTags: ["User", "AuditLog"],
        }),

        setUserLocked: builder.mutation<AdminUser, { uuid: string; locked: boolean }>({
            query: ({ uuid, locked }) => ({
                url: `/api/admin/users/${uuid}/lock`,
                method: "PATCH",
                params: { locked },
            }),
            invalidatesTags: ["User", "AuditLog"],
        }),

        deleteUser: builder.mutation<void, string>({
            query: (uuid) => ({ url: `/api/admin/users/${uuid}`, method: "DELETE" }),
            invalidatesTags: ["User", "AuditLog"],
        }),

        // ── Audit Logs ──────────────────────────────────────────
        getAuditLogs: builder.query<
            PageResponse<AuditLog>,
            { page?: number; size?: number; actorId?: string; entity?: string; dateFrom?: string; dateTo?: string }
        >({
            query: ({ page = 0, size = 50, actorId, entity, dateFrom, dateTo } = {}) => ({
                url: "/api/admin/audit",
                params: {
                    page,
                    size,
                    ...(actorId ? { actorId } : {}),
                    ...(entity ? { entity } : {}),
                    ...(dateFrom ? { dateFrom } : {}),
                    ...(dateTo ? { dateTo } : {}),
                },
            }),
            providesTags: ["AuditLog"],
        }),

        // ── Promo Codes ─────────────────────────────────────────
        getPromos: builder.query<PromoCode[], void>({
            query: () => "/api/admin/promos",
            providesTags: ["Promo"],
        }),

        createPromo: builder.mutation<PromoCode, PromoCodeRequest>({
            query: (body) => ({ url: "/api/admin/promos", method: "POST", body }),
            invalidatesTags: ["Promo"],
        }),

        expirePromo: builder.mutation<PromoCode, string>({
            query: (id) => ({ url: `/api/admin/promos/${id}/expire`, method: "PATCH" }),
            invalidatesTags: ["Promo"],
        }),

        deletePromo: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/admin/promos/${id}`, method: "DELETE" }),
            invalidatesTags: ["Promo"],
        }),

        // ── Loyalty ─────────────────────────────────────────────
        getLoyaltyOverview: builder.query<LoyaltyOverview, void>({
            query: () => "/api/admin/loyalty",
            providesTags: ["Loyalty"],
        }),

        // ── Settlement Reports ──────────────────────────────────
        getSettlementReport: builder.query<SettlementReport, { date: string }>({
            query: ({ date }) => ({
                url: "/api/admin/reports/settlement",
                params: { date },
            }),
            providesTags: ["Report"],
        }),

        exportSettlementCsv: builder.query<string, { date: string }>({
            query: ({ date }) => ({
                url: "/api/admin/reports/settlement/export",
                params: { date },
                responseHandler: async (response) => response.text(),
            }),
        }),

        // ── Product Ratings ─────────────────────────────────────
        getProductRatings: builder.query<ProductRating[], string>({
            query: (productId) => `/api/admin/products/${productId}/ratings`,
            providesTags: (_result, _err, productId) => [{ type: "Rating", id: productId }],
        }),

        getProductAverageRating: builder.query<{ productId: string; averageStars: number }, string>({
            query: (productId) => `/api/admin/products/${productId}/ratings/average`,
            providesTags: (_result, _err, productId) => [{ type: "Rating", id: `${productId}-avg` }],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useSetUserEnabledMutation,
    useSetUserLockedMutation,
    useDeleteUserMutation,
    useGetAuditLogsQuery,
    useGetPromosQuery,
    useCreatePromoMutation,
    useExpirePromoMutation,
    useDeletePromoMutation,
    useGetLoyaltyOverviewQuery,
    useGetSettlementReportQuery,
    useLazyExportSettlementCsvQuery,
    useGetProductRatingsQuery,
    useGetProductAverageRatingQuery,
} = managementApi;
