// src/lib/api.ts
const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // ตรวจสอบว่า endpoint มี / นำหน้าไหม
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const BASE_URL = RAW_URL.endsWith("/api/v3") 
  ? RAW_URL 
  : `${RAW_URL.replace(/\/$/, "")}/api/v3`;
  // ตรวจสอบ Token (เฉพาะฝั่ง Client เท่านั้น)
  const url = `${BASE_URL}${cleanEndpoint}`;

  // 1. รวม Headers
  const headers: any = {
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers, // อนุญาตให้คนเรียกใส่ Headers เพิ่มมาได้
  };

  // 2. จัดการ Content-Type อัตโนมัติ
  // ถ้าไม่ใช่ FormData และมีการส่ง Body มา ให้ตั้งค่าเป็น JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 3. จัดการ Error 401 (Token หมดอายุ/ไม่ถูกต้อง)
    if (response.status === 401 && typeof window !== "undefined") {
      const isLoginPage = window.location.pathname === "/login";
      if (!isLoginPage) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // ป้องกันการลูป (Infinite Redirect)
        if (window.location.pathname !== "/login") {
           window.location.href = "/login";
        }
      }
    }

    return response;
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};