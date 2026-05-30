"use client";

import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export type ApiResponse<T> = { success: true; data: T; message: string } | { success: false; error: string; code: number };

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry && original.url !== "/auth/refresh") {
      original._retry = true;
      try {
        const refresh = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (refresh.data.success) {
          useAuthStore.getState().setAccessToken(refresh.data.data.accessToken);
          original.headers.Authorization = `Bearer ${refresh.data.data.accessToken}`;
          return api(original);
        }
      } catch (err) {
        // Handle refresh error (e.g. redirect to login)
      }
    }
    return Promise.reject(error);
  }
);
