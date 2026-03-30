"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";

import { store } from "@/store/store";
import { hydrateFromStorage } from "@/store/slices/authSlice";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateFromStorage());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}

