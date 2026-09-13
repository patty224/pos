"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ฟอร์มเพิ่มสินค้าใหม่
  const [form, setForm] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: '',
  });

  // เก็บ id ของแถวที่กำลังแก้ไข + ข้อมูลระหว่างแก้ไข
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // โหลดรายการสินค้าครั้งแรก
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setProducts(data);
      setError('');
    }
    setLoading(false);
  }

  // ---------- เพิ่มสินค้า ----------
  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!form.sku || !form.name || !form.price) {
      alert('กรุณากรอก SKU, ชื่อสินค้า และราคา');
      return;
    }

    const { error } = await supabase.from('products').insert([
      {
        sku: form.sku,
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        unit: form.unit,
      },
    ]);

    if (error) {
      alert('เพิ่มสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setForm({ sku: '', name: '', price: '', stock: '', unit: '' });
    fetchProducts();
  }

  // ---------- ลบสินค้า ----------
  async function handleDelete(id) {
    if (!confirm('ยืนยันลบสินค้านี้?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
      return;
    }
    fetchProducts();
  }

  // ---------- แก้ไขสินค้า (inline) ----------
  function startEdit(product) {
    setEditingId(product.id);
    setEditForm({
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function saveEdit(id) {
    const { error } = await supabase
      .from('products')
      .update({
        sku: editForm.sku,
        name: editForm.name,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
        unit: editForm.unit,
      })
      .eq('id', id);

    if (error) {
      alert('แก้ไขไม่สำเร็จ: ' + error.message);
      return;
    }

    setEditingId(null);
    fetchProducts();
  }

  return (
    <div>
      <h1>รายการสินค้า</h1>

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div className="card">
        <h2>เพิ่มสินค้าใหม่</h2>
        <form
          onSubmit={handleAddProduct}
          style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}
        >
          <input
            name="sku"
            placeholder="SKU"
            value={form.sku}
            onChange={handleFormChange}
            style={{ width: '120px' }}
          />
          <input
            name="name"
            placeholder="ชื่อสินค้า"
            value={form.name}
            onChange={handleFormChange}
            style={{ width: '220px' }}
          />
          <input
            name="price"
            type="number"
            placeholder="ราคา"
            value={form.price}
            onChange={handleFormChange}
            style={{ width: '100px' }}
          />
          <input
            name="stock"
            type="number"
            placeholder="คงเหลือ"
            value={form.stock}
            onChange={handleFormChange}
            style={{ width: '100px' }}
          />
          <input
            name="unit"
            placeholder="หน่วย"
            value={form.unit}
            onChange={handleFormChange}
            style={{ width: '100px' }}
          />
          <button type="submit">เพิ่มสินค้า</button>
        </form>
      </div>

      {/* ตารางแสดงสินค้า */}
      {loading && <p>กำลังโหลด...</p>}
      {error && <p style={{ color: 'red' }}>เกิดข้อผิดพลาด: {error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>ชื่อสินค้า</th>
              <th>ราคา</th>
              <th>คงเหลือ</th>
              <th>หน่วย</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                {editingId === p.id ? (
                  // ---------- แถวโหมดแก้ไข ----------
                  <>
                    <td>
                      <input name="sku" value={editForm.sku} onChange={handleEditChange} style={{ width: '90px' }} />
                    </td>
                    <td>
                      <input name="name" value={editForm.name} onChange={handleEditChange} style={{ width: '160px' }} />
                    </td>
                    <td>
                      <input
                        name="price"
                        type="number"
                        value={editForm.price}
                        onChange={handleEditChange}
                        style={{ width: '80px' }}
                      />
                    </td>
                    <td>
                      <input
                        name="stock"
                        type="number"
                        value={editForm.stock}
                        onChange={handleEditChange}
                        style={{ width: '80px' }}
                      />
                    </td>
                    <td>
                      <input name="unit" value={editForm.unit} onChange={handleEditChange} style={{ width: '70px' }} />
                    </td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => saveEdit(p.id)}>บันทึก</button>
                      <button onClick={cancelEdit} style={{ backgroundColor: '#999' }}>
                        ยกเลิก
                      </button>
                    </td>
                  </>
                ) : (
                  // ---------- แถวโหมดแสดงผลปกติ ----------
                  <>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{Number(p.price).toLocaleString()} บ.</td>
                    <td>{p.stock}</td>
                    <td>{p.unit}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => startEdit(p)}>แก้ไข</button>
                      <button onClick={() => handleDelete(p.id)} style={{ backgroundColor: '#e00' }}>
                        ลบ
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>
                  ยังไม่มีสินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
