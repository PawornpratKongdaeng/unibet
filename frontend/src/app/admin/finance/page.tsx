export default function FinanceStats() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-900/30 border border-green-500 p-6 rounded-2xl">
          <p className="text-green-400">ยอดฝากรวม</p>
          <h2 className="text-3xl font-bold text-white">฿ 1,250,000</h2>
        </div>
        <div className="bg-red-900/30 border border-red-500 p-6 rounded-2xl">
          <p className="text-red-400">ยอดถอนรวม</p>
          <h2 className="text-3xl font-bold text-white">฿ 800,000</h2>
        </div>
        <div className="bg-blue-900/30 border border-blue-500 p-6 rounded-2xl">
          <p className="text-blue-400">กำไรสุทธิ</p>
          <h2 className="text-3xl font-bold text-yellow-400">฿ 450,000</h2>
        </div>
      </div>
      
      {/* ประวัติการฝาก-ถอนล่าสุด */}
      <h3 className="text-xl font-bold mb-4 text-white">ประวัติธุรกรรมล่าสุด</h3>
      <div className="bg-[#1e293b] rounded-xl p-4">
         {/* ใส่ตารางรายการฝากถอนที่ดึงมาจาก models.Transaction */}
      </div>
    </div>
  );
}