const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let baseUrl = RAW_URL.replace(/\/+$/, ""); 
  if (!baseUrl.includes("/api/v3")) {
    baseUrl = `${baseUrl}/api/v3`;
  }

  let cleanPath = endpoint.replace(/^\/+/, "").replace(/^api\/v3\//, "");
  const url = `${baseUrl}/${cleanPath}`;

  // ✅ 1. เพิ่มรายการ Public Path ให้ครบตามที่ Go มี (เพื่อไม่ให้มันเด้ง Logout มั่วซั่ว)
  const publicEndpoints = ["login", "register", "settings", "config/bank", "withdraw-request"];
  const isPublicPath = publicEndpoints.some(path => cleanPath.includes(path));

  const headers: any = {
    ...(token && !isPublicPath ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    console.log(`📡 [${options.method || 'GET'}] -> ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;

      // 🛑 2. แก้ไข Logic การรีไดเรกต์ (Infinite Loop Fix)
      if (response.status === 401) {
        // จะรีไดเรกต์เฉพาะเมื่อ:
        // - ไม่ใช่หน้า Public
        // - และ ปัจจุบัน "ไม่ได้" อยู่ที่หน้า Login (ป้องกันการรีเฟรชหน้าตัวเองไม่หยุด)
        if (!isPublicPath && currentPath !== "/login") {
          console.error("⛔ Session Expired or Unauthorized. Redirecting...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.replace("/login?reason=expired");
        }
      } 
      else if (response.status === 403) {
        console.error("⛔ [403] Access Denied: เช็คสิทธิ์ Admin หรือ Prefix /user");
      }
    }

    return response;
  } catch (error) {
    console.error("🚨 Network Error:", error);
    throw error;
  }
};