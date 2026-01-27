import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. ดึง Hostname และ Path
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl
  const { pathname } = url

  // 2. ข้ามไฟล์ Static / API / Next.js internal (ไม่ต้องไปยุ่ง)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // ข้ามพวกไฟล์รูป .png, .ico
  ) {
    return NextResponse.next()
  }

  // --- กรณีที่ 1: เข้าผ่าน Subdomain "backoffice" ---
  // รองรับทั้ง backoffice.thunibet.com และ localhost (สำหรับเทส)
  const isBackoffice = hostname.startsWith('backoffice');

  if (isBackoffice) {
    // ถ้า URL ยังไม่มี /admin นำหน้า -> เราจะ Rewrite แอบเติม /admin เข้าไป
    // ผู้ใช้จะเห็น URL: backoffice.thunibet.com/dashboard
    // แต่ Next.js จะเรนเดอร์ไฟล์: app/admin/dashboard
    if (!pathname.startsWith('/admin')) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url))
    }
  } 
  
  // --- กรณีที่ 2: เข้าผ่าน Domain หลัก (thunibet.com) ---
  else {
    // ป้องกันไม่ให้คนทั่วไปเข้าถึง /admin โดยตรงผ่านโดเมนหลัก
    // เช่น ถ้าพิมพ์ thunibet.com/admin -> ให้เด้งไปหน้า 404 หรือหน้าแรก
    if (pathname.startsWith('/admin')) {
      // ทางเลือก A: ส่งไปหน้า 404 (เนียนว่าไม่มีหน้านี้)
      return NextResponse.rewrite(new URL('/404', request.url)) 
      
      // ทางเลือก B: ดีดกลับไปหน้าแรก
      // return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}