// src/lib/api.ts
const BASE_URL = "http://localhost:8080/api/v3";

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // ปรับ endpoint ให้มี / นำหน้าเสมอเพื่อป้องกัน URL ติดกัน
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // แก้ไขปัญหา Infinite Redirect Loop ที่นี่
    if (response.status === 401 && typeof window !== "undefined") {
      const isLoginPage = window.location.pathname === "/login";

      // ถ้าไม่ใช่หน้า Login ให้เคลียร์ Token แล้วเด้งไปหน้า Login
      if (!isLoginPage) {
        console.warn("Unauthorized! Redirecting...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return response;
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};