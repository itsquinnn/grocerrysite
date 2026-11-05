import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PRODUCTION_API_URL = "https://backend-snowy-five-94.vercel.app/api";

/**
 * Base API URL for backend calls.
 * On localhost, connects directly to Next.js API server on port 3002 to prevent
 * router middleware interception. On deployed URLs, points to live Vercel backend.
 */
export function getApiBaseUrl(): string {
  const envUrl = typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : undefined;
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3002/api";
    }
  }
  return (envUrl || DEFAULT_PRODUCTION_API_URL).replace(/\/+$/, "");
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Core HTTP fetch wrapper that communicates with the Dovan Next.js backend.
 * Automatically injects the active Supabase JWT Bearer session token.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const baseUrl = getApiBaseUrl();
  const url = cleanEndpoint.startsWith("http")
    ? cleanEndpoint
    : `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});

  // Set default JSON Content-Type if body is present and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Automatically attach Supabase session token if available and not already provided
  if (!headers.has("Authorization")) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch {
      // Continue without token for public endpoints
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (fetchErr: any) {
    // If direct call to http://localhost:3002 failed, retry via Vite reverse proxy /api
    if (url.startsWith("http://localhost:3002/api") || url.startsWith("http://127.0.0.1:3002/api")) {
      try {
        const proxyUrl = `/api${cleanEndpoint}`;
        response = await fetch(proxyUrl, {
          ...options,
          headers,
        });
      } catch {
        throw new ApiError(
          "Backend server is offline on port 3002. Please ensure the backend is started with 'npm run dev'.",
          503,
          fetchErr
        );
      }
    } else {
      throw new ApiError("Network request failed", 503, fetchErr);
    }
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (isJson && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, isJson ? data.details : undefined);
  }

  return data as T;
}

/**
 * Convenience methods for HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, init?: RequestInit) =>
    apiFetch<T>(url, { method: "GET", ...init }),

  post: <T = any>(url: string, body?: any, init?: RequestInit) =>
    apiFetch<T>(url, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...init,
    }),

  put: <T = any>(url: string, body?: any, init?: RequestInit) =>
    apiFetch<T>(url, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...init,
    }),

  patch: <T = any>(url: string, body?: any, init?: RequestInit) =>
    apiFetch<T>(url, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...init,
    }),

  delete: <T = any>(url: string, init?: RequestInit) =>
    apiFetch<T>(url, { method: "DELETE", ...init }),
};

