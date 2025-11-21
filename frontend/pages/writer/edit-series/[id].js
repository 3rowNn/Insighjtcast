// ในไฟล์: pages/writer/edit-series/[id].js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';

// URL ของ API ที่ใช้ดึงข้อมูล Series (GET /api/series/:id)
const API_URL = 'http://localhost:5000/api/series';

// หมวดหมู่ (ต้องตรงกับ NewSeriesPage)
const categories = ['Tech', 'Life', 'News', 'Story', 'Other'];

export default function EditSeriesPage() {
    const router = useRouter();
    // 💥 1. ดึง Series ID จาก URL
    const { id: seriesId } = router.query; 

    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState('Other');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 💥 2. useEffect สำหรับดึงข้อมูล Series ปัจจุบัน
    useEffect(() => {
        if (!seriesId || !router.isReady) return;

        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'writer') {
            router.push('/login');
            return;
        }

        const fetchSeriesData = async () => {
            try {
                const res = await fetch(`${API_URL}/${seriesId}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch series data. Not found or Not authorized.');
                }
                
                const data = await res.json();
                
                // 3. ตั้งค่า State ด้วยข้อมูลปัจจุบัน
                setTitle(data.title);
                setDesc(data.desc);
                setCategory(data.category);
                
            } catch (err) {
                console.error("Fetch Series Error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSeriesData();
    }, [seriesId, router.isReady]);


    // 💥 4. ฟังก์ชัน "บันทึกการแก้ไข" (ใช้ PUT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const token = localStorage.getItem('token');
        
        try {
            const res = await fetch(`${API_URL}/${seriesId}`, { // 🎯 PUT ไปที่ /api/series/:id
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, desc, category })
            });

            const data = await res.json();

            if (res.ok) {
                alert('แก้ไข Series สำเร็จ!');
                router.push('/writer'); // สำเร็จ -> กลับไปหน้า Dashboard
            } else {
                throw new Error(data.message || 'Failed to update series.');
            }
        } catch (err) {
            console.error('Submit Error:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) {
        return <Layout wide={true}><div className="card max-w-2xl mx-auto text-center">กำลังโหลดข้อมูล Series...</div></Layout>;
    }
    
    if (error && !isLoading) {
        return <Layout wide={true}><div className="card max-w-2xl mx-auto text-red-400">Error: {error}</div></Layout>;
    }


    return (
        <Layout wide={true}>
            <div className="card max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4">แก้ไขเรื่อง</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Input Field: Title */}
                    <div>
                        <label className="text-sm text-gray-300">ชื่อเรื่อง</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                            placeholder="ชื่อเรื่องของคุณ..."
                            required
                        />
                    </div>

                    {/* Input Field: Category */}
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

                    {/* Input Field: Description */}
                    <div>
                        <label className="text-sm text-gray-300">คำโปรย / เรื่องย่อ </label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                            rows="4"
                            placeholder="อธิบาย"
                            required
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
                        <button className="btn-primary" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'กำลังบันทึก...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}