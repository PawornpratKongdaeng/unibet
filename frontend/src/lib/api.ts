// src/lib/api.ts
const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 1. จัดการ Base URL: ลบทั้ง / และ /api/v3 ออกให้หมดก่อนเพื่อให้ได้ Root URL จริงๆ
  // เช่น "http://localhost:8080/api/v3/" -> "http://localhost:8080"
  let baseUrl = RAW_URL.replace(/\/$/, "").replace(/\/api\/v3$/, "");

  // 2. จัดการ Endpoint: ลบ / ตัวแรก และ ลบ api/v3 ตัวแรกออก (ถ้ามี)
  // เพื่อไม่ให้มันไปซ้ำกับตอนที่เราจะประกอบร่าง
  let cleanPath = endpoint.replace(/^\//, "").replace(/^api\/v3\//, "");

  // 3. ประกอบร่างใหม่: บังคับให้มี /api/v3 แค่อันเดียวตรงกลางเสมอ
  const url = `${baseUrl}/api/v3/${cleanPath}`;

  const headers: any = {
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    // Debug URL ที่นี่ จะเห็นเลยว่าสวยงามแน่นอน
    console.log(`📡 [${options.method || 'GET'}] ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 4. จัดการ 401 (Unauthorized)
    if (response.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === "/login" || currentPath === "/register";

      if (!isAuthPage) {
        // เช็คก่อนว่าในเครื่องมี Token ไหม ถ้ามีแล้วยัง 401 แสดงว่า Token หมดอายุ หรือ Role ไม่ถึง
        const hasToken = !!localStorage.getItem("token");
        if (hasToken) {
          console.error("⛔ Unauthorized! Redirecting to login...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    }

    return response;
  } catch (error) {
    console.error("🚨 Fetch Error:", error);
    throw error;
  }
};