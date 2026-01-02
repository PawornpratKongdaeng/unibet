"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api'; 

// 1. กำหนด Interface สำหรับข้อมูล User
interface User {
  id: string | number;
  username: string;
  role: string;
  credit: number;
  [key: string]: any; // เผื่อฟิลด์อื่นๆ จาก Backend
}

// 2. กำหนด Interface สำหรับ Context Value
interface WalletContextType {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  user: User | null;
  refreshBalance: () => Promise<void>;
  loading: boolean;
}

// 3. สร้าง Context พร้อมระบุ Type (สำคัญมากเพื่อป้องกัน Error 'never')
const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // ใช้ชื่อ credit ภายในตามที่คุณต้องการ
  const [credit, setCredit] = useState<number>(0); 
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWalletData = useCallback(async () => {
    try {
      const res = await apiFetch('/me');
      if (res.ok) {
        const data = await res.json();
        
        // ดึงค่าจาก data.credit และแปลงเป็นตัวเลขเสมอ
        const currentCredit = Number(data.credit) || 0;
        setCredit(currentCredit); 
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
    // Auto-refresh ทุก 30 วินาที
    const interval = setInterval(fetchWalletData, 30000);
    return () => clearInterval(interval);
  }, [fetchWalletData]);

  return (
    <WalletContext.Provider value={{ 
      balance: credit,      // ส่งออกในชื่อ balance เพื่อใช้กับหน้าอื่นๆ
      setBalance: setCredit, 
      user, 
      refreshBalance: fetchWalletData, 
      loading 
    }}>
      {children}
    </WalletContext.Provider>
  );
}

// 4. Hook สำหรับเรียกใช้งาน
export function useWallet() {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    // ป้องกันกรณีเรียกใช้นอก WalletProvider และช่วยให้ TS ไม่มองว่าเป็น undefined
    // คืนค่า default ที่ตรงกับ WalletContextType เพื่อไม่ให้ Build Error ในหน้าอื่น
    return {
      balance: 0,
      setBalance: () => {},
      user: null,
      refreshBalance: async () => {},
      loading: false
    } as WalletContextType;
  }
  
  return context;
}