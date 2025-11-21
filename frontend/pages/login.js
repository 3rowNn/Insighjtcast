import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Link from 'next/link';

// 1. 📍 URL ของ Backend API (Port 5000)
const API_URL = 'http://localhost:5000/api/auth/login';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // ล้าง Error เก่า

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // ถ้า Backend ส่ง Error กลับมา (เช่น 401 Invalid password)
        throw new Error(data.message || 'Login failed');
      }

      // 2. 🛠️ FIX: บันทึกข้อมูลทั้งหมดที่จำเป็น
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('_id', data._id); // 💥 (สำคัญมากสำหรับระบบ "ไลค์")
      localStorage.setItem('username', data.username);

      // 3. 🛠️ FIX: ตรวจสอบ Role และส่งไปให้ถูกหน้า
      if (data.role === 'admin') {
        router.push('/admin'); // 🚀 ไปหน้า Admin
      } else if (data.role === 'writer') {
        router.push('/writer'); // 🚀 ไปหน้า Writer
      } else {
        router.push('/'); // 🚀 ผู้ใช้ทั่วไป ไปหน้า Home
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto card">
        <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
              required
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <div>
            <button className="btn-primary w-full" type="submit">
              Login
            </button>
          </div>
          <p className="text-sm text-gray-400 text-center">
            <Link href="/register" className="text-primary hover:underline">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}