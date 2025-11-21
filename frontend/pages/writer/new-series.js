import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout'; // (เราจะใช้ Layout เดิม)

// 1. 📍 URL ของ API (ชี้ไปที่ API 'Series' ที่เราสร้าง)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/series`;
// 2. 📍 หมวดหมู่ (ต้องตรงกับ Backend 'enum')
const categories = ['Tech', 'Life', 'News', 'Story', 'Other'];

export default function NewSeriesPage() {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState('Other');
    const [error, setError] = useState(null);
    const router = useRouter();

    // 3. ตรวจสอบสิทธิ์ (Role Check)
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (!token || role !== 'writer') {
            router.push('/login');
        }
    }, [router]);

    // 4. ฟังก์ชัน "บันทึก" (สร้าง "เรื่องแม่")
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!title || !desc) {
            setError('กรุณากรอก "ชื่อเรื่อง" และ "คำโปรย"');
            return;
        }

        const token = localStorage.getItem('token');

        try {
            const res = await fetch(API_URL, { // (POST ไปที่ /api/series)
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, desc, category })
            });

            if (res.ok) {
                router.push('/writer'); // 5. สำเร็จ -> กลับไปหน้า Writer Dashboard
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create series');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        // (เราใช้ 'wide' layout เพื่อให้ฟอร์มกว้างขึ้น)
        <Layout wide={true}>
            <div className="card max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4">สร้างเรื่องใหม่</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-300">ชื่อเรื่อง</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                            placeholder="ชื่อเรื่องของคุณ..."
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-300">หมวดหมู่</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-gray-300">คำโปรย</label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                            rows="4"
                            placeholder="อธิบายเรื่องย่อของเรื่องนี้..."
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.push('/writer')}
                            className="btn-ghost"
                        >
                            Cancel
                        </button>
                        <button className="btn-primary" type="submit">
                            Save Series
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}