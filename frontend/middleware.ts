import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. ดึง Hostname และ Path ปัจจุบัน
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // 2. ข้ามไฟล์ระบบ (System Files) ไม่ให้โดน Block
  // (พวกรูปภาพ, css, api, fonts ต้องปล่อยผ่านเสมอ)
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') || 
    pathname.includes('.') // ไฟล์ที่มีนามสกุล เช่น favicon.ico, logo.png
  ) {
    return NextResponse.next();
  }

  // -----------------------------------------------------------
  // 🔴 CASE 1: ฝั่ง Admin (backoffice.thunibet.com)
  // -----------------------------------------------------------
  // เช็คว่า hostname มีคำว่า backoffice หรือไม่ (รองรับทั้ง http/https)
  if (hostname.includes('backoffice.thunibet.com')) {
    
    // ถ้า Path **ไม่ได้** ขึ้นต้นด้วย /admin (เช่นเข้าหน้า / หรือ /profile ของ user)
    if (!pathname.startsWith('/admin')) {
      // บังคับเด้งไปหน้า Login ของ Admin ทันที
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // ถ้าเป็น path /admin อยู่แล้ว ก็ปล่อยผ่าน
    return NextResponse.next();
  }

  // -----------------------------------------------------------
  // 🔵 CASE 2: ฝั่ง User (thunibet.com หรือ www.thunibet.com)
  // -----------------------------------------------------------
  // (รวมถึง localhost ตอน dev ด้วย ถ้าคุณไม่ได้ set host)
  else {
    
    // ถ้า User ทะลึ่งพิมพ์ URL เข้าหน้า /admin
    if (pathname.startsWith('/admin')) {
      // ดีดกลับไปหน้าแรกของ User ทันที (หรือจะส่งไป 404 ก็ได้)
      return NextResponse.redirect(new URL('/', request.url));
    }

    // ถ้าเข้าหน้าปกติ ก็ปล่อยผ่าน
    return NextResponse.next();
  }
}

// Config: ระบุว่าจะให้ Middleware ทำงานกับทุก Route ยกเว้นไฟล์ Static
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};