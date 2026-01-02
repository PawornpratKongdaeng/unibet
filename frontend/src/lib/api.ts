// src/lib/api.ts
const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiFetch = async (endpoint: string, options: any = {}) => {
  // 1. ตรวจสอบ Token เฉพาะฝั่ง Client
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 2. จัดการ URL ให้ถูกต้องเสมอ (Normalization)
  let baseUrl = RAW_URL.replace(/\/+$/, ""); // ลบ / ตัวสุดท้ายถ้ามี
  if (!baseUrl.includes("/api/v3")) {
    baseUrl = `${baseUrl}/api/v3`;
  }

  // ป้องกันการใส่ / ซ้ำซ้อน และลบ api/v3 ออกจาก endpoint หากหลุดมา
  let cleanPath = endpoint.replace(/^\/+/, "").replace(/^api\/v3\//, "");
  const url = `${baseUrl}/${cleanPath}`;

  // 3. ตั้งค่า Headers
  const headers: any = {
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // ตรวจสอบ Content-Type อัตโนมัติ (ยกเว้นการส่งไฟล์ FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    // แสดง Log การยิง API เพื่อช่วย Debug (เห็นได้ใน Console ของ Browser)
    console.log(`📡 [${options.method || 'GET'}] -> ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 4. การจัดการ HTTP Status เฉพาะฝั่ง Client
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;

      // 🛑 401: Unauthorized (Token หมดอายุ หรือ ไม่ถูกต้อง)
      if (response.status === 401) {
        const hasSavedToken = localStorage.getItem("token");
        const isAuthPage = currentPath === "/login" || currentPath === "/register";

        // ถ้ามี Token ค้างอยู่แต่ใช้ไม่ได้ และไม่ได้อยู่หน้า Login ให้เตะออก
        if (hasSavedToken && !isAuthPage) {
          console.error("⛔ Session Expired. Redirecting to login...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.replace("/login?reason=expired");
        }
      } 
      
      // 🛑 403: Forbidden (สิทธิ์ไม่พอ เช่น User จะเข้าหน้า Admin)
      else if (response.status === 403) {
        // บันทึก Log แจ้งเตือนเรื่องสิทธิ์ (ตามที่ปรากฏในรูปภาพ image_eba4b2.png)
        console.error("⛔ [403] Access Denied: Permission insufficient.");
      }

      // 🛑 404: Not Found (หา API ไม่เจอ)
      else if (response.status === 404) {
        console.warn(`⚠️ [404] Endpoint not found: ${url}`);
      }
    }

    return response;
  } catch (error) {
    console.error("🚨 Network Error (Server might be down):", error);
    throw error;
  }
};