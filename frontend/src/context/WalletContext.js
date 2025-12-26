"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api'; 

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  // 1. เปลี่ยนชื่อจาก balance -> credit และ setBalance -> setCredit
  const [credit, setCredit] = useState(0); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = useCallback(async () => {
    try {
      const res = await apiFetch('/me');
      if (res.ok) {
        const data = await res.json();
        
        // 2. เรียกใช้ setCredit ให้ตรงกับที่ประกาศไว้ข้างบน
        // และดึงค่าจาก data.credit (ตามที่ Backend ส่งมา)
        setCredit(data.credit || 0); 
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
    const interval = setInterval(fetchWalletData, 30000);
    return () => clearInterval(interval);
  }, [fetchWalletData]);

  return (
    <WalletContext.Provider value={{ 
      balance: credit,      // ส่งออกในชื่อ balance (เพื่อให้คอมโพเนนต์อื่นไม่ต้องแก้โค้ดเยอะ)
      setBalance: setCredit, // ส่งออก setter ในชื่อ setBalance
      user, 
      refreshBalance: fetchWalletData, 
      loading 
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}