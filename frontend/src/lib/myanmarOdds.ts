"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { X, Trophy, ShieldAlert } from 'lucide-react';

// ============================================================================
// PART 1: Helper Functions (วางไว้บนสุด เพื่อให้ Component มองเห็นเสมอ)
// ============================================================================

export const safeFloat = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

// ฟังก์ชันจัดรูปแบบตัวเลข: HDP 1.0, Price -64 => "1-64"
export const formatMyanmarDisplay = (hdp: number | string, price: number | string) => {
    const hdpVal = Math.abs(safeFloat(hdp));
    const pVal = safeFloat(price);
    
    const sign = pVal < 0 ? "-" : "+"; 
    const displayPrice = Math.abs(pVal); 
  
    // ตัด .0 ออกถ้าเป็นจำนวนเต็ม (เช่น 1.0 -> 1)
    const hdpDisplay = Number.isInteger(hdpVal) ? hdpVal.toString() : hdpVal.toFixed(1);
    
    return `${hdpDisplay}${sign}${displayPrice}`;
};

export const calculateMyanmarPayout = (stake: number, price: number, type: string) => {
    const s = safeFloat(stake);
    let p = safeFloat(price);
    
    // *** จุดที่ปรับปรุง: กำหนดเรทจ่ายสูงสุดให้เป็น 0.97 ตามเว็บตัวอย่าง ***
    // (เพื่อให้ Stake 50 -> กำไร 48.5 -> รวม 98.5 แม้จะเป็นน้ำแดง)
    const MAX_PAYOUT_RATE = 0.97; 

    if (s <= 0) return { win: 0, profit: 0, risk: 0 };
  
    let profit = 0;
    let risk = s;

    // 1. OE (คู่/คี่) -> ปกติจ่าย 0.90 หรือ 0.95 แล้วแต่เว็บ
    // (ในที่นี้คงไว้ที่ 0.90 ตาม Code เดิม)
    if (type === 'OE') {
        profit = s * 0.90;
        risk = s;
        return { win: s + profit, profit: profit, risk: risk };
    } 

    // 2. HDP / OU
    // เช็คว่าราคาเป็นจำนวนเต็ม (97) หรือทศนิยม (0.97)
    const isIntegerFormat = Math.abs(p) > 2.0; 
    const normalizedPrice = isIntegerFormat ? p / 100 : p;

    if (p < 0) { 
        // === น้ำแดง (Negative) ===
        // ปกติ: profit = s (ได้เต็ม)
        // แก้ไข: คูณ MAX_PAYOUT_RATE (0.97) เพื่อให้ตรงกับเว็บตัวอย่างที่หักค่าต๋ง
        profit = s * MAX_PAYOUT_RATE; 
        
        // ความเสี่ยง (Risk) ยังคงคิดตามราคาน้ำจริง (Deduct ตามจริง)
        risk = s * Math.abs(normalizedPrice); 
    } else {
        // === น้ำดำ (Positive) ===
        // ถ้าราคาน้ำมากกว่า 0.97 ให้ปรับลงมาเหลือ 0.97 (Capped)
        // เพื่อไม่ให้จ่ายเกินเรทเพดานของเว็บ
        let finalPrice = normalizedPrice;
        if (finalPrice > MAX_PAYOUT_RATE) {
             finalPrice = MAX_PAYOUT_RATE;
        }

        profit = s * finalPrice; 
        risk = s; 
    }

    // Win = ทุน (s) + กำไร (profit)
    // ผลลัพธ์: 50 + (50 * 0.97) = 50 + 48.5 = 98.5
    return { win: s + profit, profit: profit, risk: risk };
};