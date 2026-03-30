// ============================================================
// Admin — Auth API (RTK Query)
// src/store/api/authApi.ts
// ============================================================
import { baseApi } from "./baseApi";
import { setCredentials, clearCredentials } from "@/store/slices/authSlice";
import type { UserInfo } from "@/store/slices/authSlice";

export interface LoginRequest {
    username: string;   // email OR username — backend accepts both
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: UserInfo;
}

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (body) => ({ url: "/api/public/auth/login", method: "POST", body }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                const { data } = await queryFulfilled;
                dispatch(setCredentials({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    user: data.user,
                }));
            },
        }),

        refresh: builder.mutation<AuthResponse, { refreshToken: string }>({
            query: (body) => ({ url: "/api/public/auth/refresh", method: "POST", body }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                const { data } = await queryFulfilled;
                dispatch(setCredentials({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    user: data.user,
                }));
            },
        }),

        logout: builder.mutation<void, void>({
            queryFn: () => ({ data: undefined as void }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                await queryFulfilled;
                dispatch(clearCredentials());
                dispatch(baseApi.util.resetApiState());
            },
        }),
    }),
});

export const { useLoginMutation, useRefreshMutation, useLogoutMutation } = authApi;
