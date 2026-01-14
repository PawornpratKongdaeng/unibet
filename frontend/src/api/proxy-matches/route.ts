// app/api/proxy-matches/route.ts
import { NextResponse } from 'next/server';

// ✅ ต้อง export function ชื่อ GET (ตัวพิมพ์ใหญ่)
export async function GET() {
  try {
    const targetUrl = "https://htayapi.com/mmk-autokyay/v3/moung?key=eXBW5dl32piS2UbN75U1vikjWJJ9v7Ke";
    
    const res = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: `External API Error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}