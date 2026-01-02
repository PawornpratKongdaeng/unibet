const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let baseUrl = RAW_URL.replace(/\/+$/, ""); 
  if (!baseUrl.includes("/api/v3")) {
    baseUrl = `${baseUrl}/api/v3`;
  }

  let cleanPath = endpoint.replace(/^\/+/, "").replace(/^api\/v3\//, "");
  const url = `${baseUrl}/${cleanPath}`;

  // ✅ ตรวจสอบว่าเป็นเส้นทางที่ไม่ต้องใช้ Token หรือไม่
  const isPublicPath = endpoint.includes("login") || endpoint.includes("register");

  const headers: any = {
    // ✅ ส่ง Token เฉพาะเมื่อมี และ "ไม่ใช่" หน้า Login/Register
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
      // 🛑 401: Unauthorized
      if (response.status === 401) {
        if (!isPublicPath) { // ถ้าติด 401 ในหน้าที่ไม่ใช่ Login ให้ Logout
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.replace("/login?reason=expired");
        }
      } 
      // 🛑 403: Forbidden (สิทธิ์ไม่พอ - มักเกิดจากเรียก Path ผิดกลุ่ม)
      else if (response.status === 403) {
        console.error("⛔ [403] Access Denied: เช็คว่าใส่ Prefix /user หรือ /admin หรือยัง");
      }
    }

    return response;
  } catch (error) {
    console.error("🚨 Network Error:", error);
    throw error;
  }
};