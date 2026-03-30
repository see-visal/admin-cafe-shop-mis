// ============================================================
// Admin — Profile API (RTK Query)
// src/store/api/profileApi.ts
// ============================================================
import { baseApi } from "./baseApi";

export interface AdminProfile {
    uuid: string;
    username: string;
    email: string;
    familyName: string;
    givenName: string;
    phoneNumber: string | null;
    gender: string | null;
    dob: string | null;
    profileImage: string | null;
    coverImage: string | null;
    roles: string[];
    loyaltyPoints: number | null;
    notificationPreference: string | null;
}

export interface UpdateProfileRequest {
    givenName?: string;
    familyName?: string;
    phoneNumber?: string;
    gender?: string;
    dob?: string | null;
    profileImage?: string;
    coverImage?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const profileApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminProfile: builder.query<AdminProfile, void>({
            query: () => "/api/customer/profile",
            providesTags: ["User"],
        }),

        updateAdminProfile: builder.mutation<AdminProfile, UpdateProfileRequest>({
            query: (body) => ({ url: "/api/customer/profile", method: "PUT", body }),
            invalidatesTags: ["User"],
        }),

        changeAdminPassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
            query: (body) => ({ url: "/api/customer/profile/password", method: "PUT", body }),
        }),
    }),
});

export const {
    useGetAdminProfileQuery,
    useUpdateAdminProfileMutation,
    useChangeAdminPasswordMutation,
} = profileApi;
