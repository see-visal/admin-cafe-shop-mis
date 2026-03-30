// ============================================================
// Admin — Inventory API (RTK Query)
// Endpoints: GET/POST/PUT /admin/ingredients, PATCH adjust-stock, DELETE
// src/store/api/inventoryApi.ts
// ============================================================
import { baseApi } from "./baseApi";
import type { Ingredient } from "@/types";

interface IngredientRequest {
    name: string;
    unit: string;
    stockQty: number;
    lowThreshold: number;
    supplier?: string;
    imageUrl?: string;
}

interface UploadIngredientImageResponse {
    imageUrl: string;
}

interface StockAdjustRequest {
    ingredientId: string;
    /** Positive = restock, Negative = consumed/waste */
    delta: number;
    reason?: string;
}

export const inventoryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getIngredients: builder.query<Ingredient[], void>({
            query: () => "/api/admin/ingredients",
            providesTags: ["Ingredient"],
        }),

        getIngredient: builder.query<Ingredient, string>({
            query: (id) => `/api/admin/ingredients/${id}`,
            providesTags: (_result, _err, id) => [{ type: "Ingredient", id }],
        }),

        getStockAlerts: builder.query<Ingredient[], void>({
            query: () => "/api/admin/ingredients/alerts",
            providesTags: ["Ingredient"],
        }),

        createIngredient: builder.mutation<Ingredient, IngredientRequest>({
            query: (body) => ({ url: "/api/admin/ingredients", method: "POST", body }),
            invalidatesTags: ["Ingredient", "Dashboard"],
        }),

        updateIngredient: builder.mutation<Ingredient, { id: string; body: IngredientRequest }>({
            query: ({ id, body }) => ({ url: `/api/admin/ingredients/${id}`, method: "PUT", body }),
            invalidatesTags: ["Ingredient"],
        }),

        uploadIngredientImage: builder.mutation<UploadIngredientImageResponse, { id: string; file: File }>({
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append("file", file);

                return {
                    url: `/api/admin/ingredients/${id}/image`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["Ingredient", "Dashboard"],
        }),

        adjustStock: builder.mutation<Ingredient, StockAdjustRequest>({
            query: (body) => ({ url: "/api/admin/ingredients/adjust-stock", method: "PATCH", body }),
            invalidatesTags: ["Ingredient", "Dashboard"],
        }),

        deleteIngredient: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/admin/ingredients/${id}`, method: "DELETE" }),
            invalidatesTags: ["Ingredient", "Dashboard"],
        }),
    }),
});

export const {
    useGetIngredientsQuery,
    useGetIngredientQuery,
    useGetStockAlertsQuery,
    useCreateIngredientMutation,
    useUpdateIngredientMutation,
    useUploadIngredientImageMutation,
    useAdjustStockMutation,
    useDeleteIngredientMutation,
} = inventoryApi;
