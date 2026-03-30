// ============================================================
// Admin — Dashboard, Orders, Categories & Payments API (RTK Query)
// src/store/api/dashboardApi.ts
// ============================================================
import { baseApi } from "./baseApi";
import type {
    DashboardStats,
    Order,
    Category,
    Payment,
    Receipt,
    PageResponse,
} from "@/types";

interface CategoryRequest {
    name: string;
    icon?: string;
    imageUrl?: string;
}

interface UploadCategoryImageResponse {
    imageUrl: string;
}

interface OrdersQueryParams {
    page?: number;
    size?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const dashboardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ── Dashboard ──────────────────────────────────────────────
        getDashboard: builder.query<DashboardStats, void>({
            query: () => "/api/admin/dashboard",
            providesTags: ["Dashboard"],
        }),

        // ── Orders ────────────────────────────────────────────────
        getAllOrders: builder.query<PageResponse<Order>, OrdersQueryParams>({
            query: ({ page = 0, size = 20, status, dateFrom, dateTo } = {}) => ({
                url: "/api/admin/orders",
                params: {
                    page,
                    size,
                    ...(status ? { status } : {}),
                    ...(dateFrom ? { dateFrom } : {}),
                    ...(dateTo ? { dateTo } : {}),
                },
            }),
            providesTags: ["Order"],
        }),

        exportOrdersCsv: builder.query<string, { status?: string; dateFrom?: string; dateTo?: string }>({
            query: ({ status, dateFrom, dateTo } = {}) => ({
                url: "/api/admin/orders/export",
                params: {
                    ...(status ? { status } : {}),
                    ...(dateFrom ? { dateFrom } : {}),
                    ...(dateTo ? { dateTo } : {}),
                },
                responseHandler: async (response) => response.text(),
            }),
        }),

        getBaristaQueue: builder.query<Order[], void>({
            query: () => "/api/barista/queue",
            providesTags: ["Order"],
        }),

        updateOrderStatus: builder.mutation<Order, { id: string; status: string }>({
            query: ({ id, status }) => ({
                url: `/api/admin/orders/${id}/status`,
                method: "PUT",
                body: { status },
            }),
            invalidatesTags: ["Order", "Dashboard"],
        }),

        cancelOrder: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/admin/orders/${id}/cancel`, method: "PATCH" }),
            invalidatesTags: ["Order", "Dashboard", "Payment"],
        }),

        // ── Categories ────────────────────────────────────────────
        getAdminCategories: builder.query<Category[], void>({
            query: () => "/api/admin/categories",
            providesTags: ["Category"],
        }),

        createCategory: builder.mutation<Category, CategoryRequest>({
            query: (body) => ({ url: "/api/admin/categories", method: "POST", body }),
            invalidatesTags: ["Category"],
        }),

        updateCategory: builder.mutation<Category, { id: number; body: CategoryRequest }>({
            query: ({ id, body }) => ({ url: `/api/admin/categories/${id}`, method: "PUT", body }),
            invalidatesTags: ["Category"],
        }),

        uploadCategoryImage: builder.mutation<UploadCategoryImageResponse, { id: number; file: File }>({
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append("file", file);

                return {
                    url: `/api/admin/categories/${id}/image`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["Category"],
        }),

        deleteCategory: builder.mutation<void, number>({
            query: (id) => ({ url: `/api/admin/categories/${id}`, method: "DELETE" }),
            invalidatesTags: ["Category"],
        }),

        // ── Payments ──────────────────────────────────────────────
        getPaymentByOrder: builder.query<Payment, string>({
            query: (orderId) => `/api/admin/payments/order/${orderId}`,
            providesTags: (_result, _err, orderId) => [{ type: "Payment", id: orderId }],
        }),

        confirmPayment: builder.mutation<Payment, { paymentId: string; transactionRef?: string }>({
            query: ({ paymentId, transactionRef }) => ({
                url: `/api/admin/payments/${paymentId}/confirm`,
                method: "PATCH",
                params: transactionRef ? { transactionRef } : {},
            }),
            invalidatesTags: ["Payment", "Order", "Dashboard"],
        }),

        voidOrRefundPayment: builder.mutation<Payment, { paymentId: string; reason?: string }>({
            query: ({ paymentId, reason }) => ({
                url: `/api/admin/payments/${paymentId}/void-or-refund`,
                method: "PATCH",
                body: reason ? { reason } : {},
            }),
            invalidatesTags: ["Payment", "Order", "Dashboard", "Report"],
        }),

        getReceipt: builder.query<Receipt, string>({
            query: (orderId) => `/api/admin/orders/${orderId}/receipt`,
        }),
    }),
});

export const {
    useGetDashboardQuery,
    useGetAllOrdersQuery,
    useLazyExportOrdersCsvQuery,
    useGetBaristaQueueQuery,
    useUpdateOrderStatusMutation,
    useCancelOrderMutation,
    useGetAdminCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useUploadCategoryImageMutation,
    useDeleteCategoryMutation,
    useGetPaymentByOrderQuery,
    useConfirmPaymentMutation,
    useVoidOrRefundPaymentMutation,
    useGetReceiptQuery,
} = dashboardApi;
