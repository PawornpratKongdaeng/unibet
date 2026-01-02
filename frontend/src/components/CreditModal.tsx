// app/agent/components/CreditModal.tsx
"use client";
import { useState } from "react";
import { showToast } from "@/lib/sweetAlert";
import { apiFetch } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetUser: any;
  agentInfo: any;
  onSuccess: () => void;
}

export default function CreditModal({ isOpen, onClose, targetUser, agentInfo, onSuccess }: Props) {
  const [amount, setAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTransfer = async (type: "add" | "withdraw") => {
    if (amount <= 0) return showToast("error", "กรุณาระบุจำนวนเงินที่ถูกต้อง");

    // เช็คยอดเงิน Agent ก่อน (ถ้าเป็นการเติมให้ลูกทีม)
    if (type === "add" && amount > agentInfo.balance && agentInfo.role !== "admin") {
      return showToast("error", "เครดิตของคุณไม่เพียงพอ");
    }

    // เช็คยอดเงินลูกทีม (ถ้าเป็นการตัดเงินกลับ)
    if (type === "withdraw" && amount > targetUser.balance) {
      return showToast("error", "ยอดเงินลูกทีมมีไม่ถึงที่ต้องการตัด");
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/agent/transfer", {
        method: "POST",
        body: JSON.stringify({
          from_id: type === "add" ? agentInfo.id : targetUser.id, // ใครเป็นคนจ่าย
          to_id: type === "add" ? targetUser.id : agentInfo.id,   // ใครเป็นคนรับ
          amount: amount
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("success", "ทำรายการสำเร็จ");
        onSuccess();
        onClose();
      } else {
        showToast("error", data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      showToast("error", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] border border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-2">จัดการเครดิต: {targetUser.username}</h2>
        <p className="text-gray-400 text-sm mb-6">เครดิตปัจจุบันของสมาชิก: <span className="text-white font-bold">฿{targetUser.balance.toLocaleString()}</span></p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">จำนวนเงิน (THB)</label>
            <input 
              type="number" 
              className="w-full bg-slate-800 border border-gray-600 rounded-lg p-3 text-2xl font-mono text-center outline-none focus:border-yellow-500"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleTransfer("add")}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              + เติมเงิน
            </button>
            <button 
              onClick={() => handleTransfer("withdraw")}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              - ตัดเงินกลับ
            </button>
          </div>
          <button onClick={onClose} className="w-full text-gray-400 text-sm hover:text-white mt-2">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}