"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api'; 

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลเงินล่าสุด
  const fetchWalletData = useCallback(async () => {
    try {
      const res = await apiFetch('/me');
      if (res.ok) {
        const data = await res.json();
        // 🚩 เปลี่ยนจาก data.balance เป็น data.credit ให้ตรงกับ DB
        setCredit(data.credit || 0); 
        setUser(data);
      } else {
        // 🚩 ถ้า res.ok เป็น false (เช่น 401) ให้จัดการ Error ตรงนี้
        console.error("Unauthorized: Please login again");
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
      balance, 
      setBalance, 
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