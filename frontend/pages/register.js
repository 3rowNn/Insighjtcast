import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Link from 'next/link';

// 1. 📍 URL ของ Backend API (Port 5000)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/auth/register`;

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // 1. 💥 NEW: เพิ่ม State สำหรับ "ตัวเลือก"
  const [desiredRole, setDesiredRole] = useState('user');
  const [writerReason, setWriterReason] = useState('');

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 2. 🛠️ FIX: ตรวจสอบว่ากรอกเหตุผลหรือยัง
    if (desiredRole === 'writer' && writerReason.trim() === '') {
      setError('Please provide a reason for your writer application.');
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          // 3. 🛠️ FIX: ส่ง "เหตุผล" (Reason) ไปแทน "Role"
          writerReason: (desiredRole === 'writer') ? writerReason : ''
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // 4. 🛠️ FIX: บันทึกข้อมูล (แม้ว่าจะเป็น 'user' ก็ตาม)
      // (เพื่อให้ระบบ 'Like' ทำงานได้ แม้จะยังไม่ Login)
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('_id', data._id);
      localStorage.setItem('username', data.username);

      router.push('/login'); // 5. สมัครสำเร็จ ไปหน้า Login

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto card">
        <h2 className="text-2xl font-semibold mb-4 text-center">Register</h2>
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

          {/* 5. 💥 NEW: เพิ่มตัวเลือก Role */}
          <div>
            <label className="text-sm text-gray-300">โปรดเลือก</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={desiredRole === 'user'}
                  onChange={() => setDesiredRole('user')}
                  className="w-4 h-4"
                />
                User 
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="writer"
                  checked={desiredRole === 'writer'}
                  onChange={() => setDesiredRole('writer')}
                  className="w-4 h-4"
                />
                Writer 
              </label>
            </div>
          </div>

          {/* 6. 💥 NEW: กล่องเหตุผล (ถ้าเลือก Writer) */}
          {desiredRole === 'writer' && (
            <div id="writer-reason-box">
              <label className="text-sm text-gray-300">ทำไมคุณถึงอยากเป็น writer</label>
              <textarea
                value={writerReason}
                onChange={(e) => setWriterReason(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                rows="3"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <div>
            <button className="btn-primary w-full" type="submit">
              Register
            </button>
          </div>
          <p className="text-sm text-gray-400 text-center">
            <Link href="/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}