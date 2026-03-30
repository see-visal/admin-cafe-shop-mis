// ============================================================
// Admin — Products API (RTK Query)
// src/store/api/productsApi.ts
// ============================================================
import { baseApi } from "./baseApi";
import type { Product, PageResponse } from "@/types";

/** Matches backend ProductRequest — no 'active' field; use softDelete to deactivate */
interface ProductRequest {
    name: string;
    description?: string;
    price: number;
    categoryId?: number;
    imageUrl?: string;
    showOnHomepage?: boolean;
    todaySpecial?: boolean;
    homePriority?: number;
}

interface UploadProductImageResponse {
    imageUrl: string;
}

export const productsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminProducts: builder.query<PageResponse<Product>, { page?: number; size?: number }>({
            query: ({ page = 0, size = 20 } = {}) => ({
                url: "/api/admin/products",
                params: { page, size },
            }),
            providesTags: ["Product"],
        }),

        createProduct: builder.mutation<Product, ProductRequest>({
            query: (body) => ({ url: "/api/admin/products", method: "POST", body }),
            invalidatesTags: ["Product", "Dashboard"],
        }),

        updateProduct: builder.mutation<Product, { id: string; body: ProductRequest }>({
            query: ({ id, body }) => ({ url: `/api/admin/products/${id}`, method: "PUT", body }),
            invalidatesTags: ["Product"],
        }),

        softDeleteProduct: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/admin/products/${id}`, method: "DELETE" }),
            invalidatesTags: ["Product", "Dashboard"],
        }),

        setProductAvailability: builder.mutation<Product, { id: string; available: boolean }>({
            query: ({ id, available }) => ({
                url: `/api/admin/products/${id}/availability`,
                method: "PATCH",
                params: { available },
            }),
            invalidatesTags: ["Product", "Dashboard"],
        }),

        uploadProductImage: builder.mutation<UploadProductImageResponse, { id: string; file: File }>({
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append("file", file);

                return {
                    url: `/api/admin/products/${id}/image`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["Product", "Dashboard"],
        }),
    }),
});

export const {
    useGetAdminProductsQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useSoftDeleteProductMutation,
    useSetProductAvailabilityMutation,
    useUploadProductImageMutation,
} = productsApi;
