import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UserInfo {
  uuid: string;
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  roles: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: UserInfo }>) {
      const { accessToken, refreshToken, user } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
      }
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    },
    hydrateFromStorage(state) {
      if (typeof window === "undefined") return;
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const user = localStorage.getItem("user");
      if (accessToken && refreshToken) {
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.user = user ? JSON.parse(user) : null;
        state.isAuthenticated = true;
      }
    },
  },
});

export const { setCredentials, clearCredentials, hydrateFromStorage } = authSlice.actions;
export default authSlice.reducer;

