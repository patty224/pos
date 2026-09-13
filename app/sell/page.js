"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // โหลดรายการสินค้าไว้ให้เลือกใน dropdown
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setProducts(data);
      setError('');
    }
    setLoading(false);
  }

  // หาสินค้าที่เลือกอยู่ตอนนี้ (ไว้ใช้คำนวณยอดรวมและเช็ค stock)
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // คำนวณยอดรวม = ราคา x จำนวน
  const qtyNumber = Number(quantity) || 0;
  const totalPrice = selectedProduct ? selectedProduct.price * qtyNumber : 0;

  function resetForm() {
    setSelectedProductId('');
    setQuantity('');
  }

  async function handleSell(e) {
    e.preventDefault();
    setMessage('');

    if (!selectedProduct) {
      alert('กรุณาเลือกสินค้า');
      return;
    }
    if (qtyNumber <= 0) {
      alert('กรุณากรอกจำนวนให้ถูกต้อง');
      return;
    }

    // ตรวจสอบ stock เพียงพอหรือไม่
    if (qtyNumber > selectedProduct.stock) {
      alert(`สินค้าคงเหลือไม่พอ (คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit})`);
      return;
    }

    setSubmitting(true);

    // 1) บันทึกรายการขายลงตาราง sales
    const { error: saleError } = await supabase.from('sales').insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qtyNumber,
        total_price: totalPrice,
        sold_at: new Date().toISOString(),
      },
    ]);

    if (saleError) {
      alert('บันทึกการขายไม่สำเร็จ: ' + saleError.message);
      setSubmitting(false);
      return;
    }

    // 2) อัปเดต stock ในตาราง products ให้ลดลง
    const newStock = selectedProduct.stock - qtyNumber;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (updateError) {
      alert('ขายสำเร็จ แต่ปรับปรุงสต็อกไม่สำเร็จ: ' + updateError.message);
      setSubmitting(false);
      return;
    }

    setMessage(`ขายสำเร็จ! ${selectedProduct.name} x ${qtyNumber} = ${totalPrice.toLocaleString()} บ.`);
    resetForm();
    fetchProducts(); // โหลดสินค้าใหม่เพื่ออัปเดต stock ที่แสดงผล
    setSubmitting(false);
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {loading && <p>กำลังโหลดสินค้า...</p>}
      {error && <p style={{ color: 'red' }}>เกิดข้อผิดพลาด: {error}</p>}

      {!loading && !error && (
        <div className="card">
          <form onSubmit={handleSell} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
            {/* Dropdown เลือกสินค้า */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>สินค้า</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- เลือกสินค้า --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({Number(p.price).toLocaleString()} บ./{p.unit}) - คงเหลือ {p.stock}
                  </option>
                ))}
              </select>
            </div>

            {/* จำนวนที่จะขาย */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>จำนวน</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* แสดงยอดรวมอัตโนมัติ */}
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              ยอดรวม: {totalPrice.toLocaleString()} บ.
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? 'กำลังบันทึก...' : 'ขาย'}
            </button>
          </form>

          {message && (
            <p style={{ color: 'green', marginTop: '12px', fontWeight: 500 }}>{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
