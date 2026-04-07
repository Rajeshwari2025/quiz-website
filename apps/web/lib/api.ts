"use client";

import { apiErrorSchema } from "@quiz/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
let accessToken: string | null = null;

export function getAccessToken() {
  if (typeof window !== "undefined" && !accessToken) {
    accessToken = window.localStorage.getItem("quiz_access_token");
  }

  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;

  if (typeof window !== "undefined") {
    if (token) {
      window.localStorage.setItem("quiz_access_token", token);
    } else {
      window.localStorage.removeItem("quiz_access_token");
    }
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);

  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry) {
    try {
      const refreshed = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshed.ok) {
        const payload = await refreshed.json();
        if (payload.accessToken) {
          setAccessToken(payload.accessToken);
          return apiRequest<T>(path, init, false);
        }
      }
    } catch {
      setAccessToken(null);
    }
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload);

    if (parsedError.success) {
      throw parsedError.data.error;
    }

    throw payload;
  }

  return payload as T;
}

