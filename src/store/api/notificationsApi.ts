import { baseApi } from "./baseApi";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({
        page = 0,
        size = 20,
        type,
        priority,
      }: {
        page?: number;
        size?: number;
        type?: string;
        priority?: string;
      } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          size: size.toString(),
        });
        if (type) params.append("type", type);
        if (priority) params.append("priority", priority);

        return {
          url: `/api/admin/notifications?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Notification"],
    }),

    getUnreadNotifications: builder.query({
      query: ({ page = 0, size = 20 }: { page?: number; size?: number } = {}) => ({
        url: `/api/admin/notifications/unread?page=${page}&size=${size}`,
        method: "GET",
      }),
      providesTags: ["Notification"],
    }),

    getUnreadCount: builder.query({
      query: () => ({
        url: "/api/admin/notifications/unread/count",
        method: "GET",
      }),
      providesTags: ["Notification"],
    }),

    getNotification: builder.query({
      query: (id: string) => ({
        url: `/api/admin/notifications/${id}`,
        method: "GET",
      }),
      providesTags: ["Notification"],
    }),

    markAsRead: builder.mutation({
      query: (id: string) => ({
        url: `/api/admin/notifications/${id}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAsUnread: builder.mutation({
      query: (id: string) => ({
        url: `/api/admin/notifications/${id}/unread`,
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/api/admin/notifications/mark-all-read",
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),

    deleteNotification: builder.mutation({
      query: (id: string) => ({
        url: `/api/admin/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationsQuery,
  useGetUnreadCountQuery,
  useGetNotificationQuery,
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;

