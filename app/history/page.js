"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false }); // ล่าสุดไปเก่าสุด

    if (error) {
      setError(error.message);
    } else {
      setSales(data);
      setError('');
    }
    setLoading(false);
  }

  // คำนวณยอดขายรวมทั้งหมดจาก total_price ของทุกแถว
  const grandTotal = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

  // แปลง ISO date string ให้อ่านง่ายแบบไทย
  function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      {loading && <p>กำลังโหลด...</p>}
      {error && <p style={{ color: 'red' }}>เกิดข้อผิดพลาด: {error}</p>}

      {!loading && !error && (
        <>
          {/* สรุปยอดขายรวมทั้งหมด */}
          <div className="card" style={{ fontSize: '18px', fontWeight: 700 }}>
            ยอดขายรวมทั้งหมด: {grandTotal.toLocaleString()} บ.
          </div>

          <table>
            <thead>
              <tr>
                <th>วันเวลาที่ขาย</th>
                <th>ชื่อสินค้า</th>
                <th>จำนวน</th>
                <th>ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.sold_at)}</td>
                  <td>{s.product_name}</td>
                  <td>{s.quantity}</td>
                  <td>{Number(s.total_price).toLocaleString()} บ.</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>
                    ยังไม่มีประวัติการขาย
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
