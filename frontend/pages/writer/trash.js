import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

const API_SERIES = 'http://localhost:5000/api/series';
const API_PODCASTS = 'http://localhost:5000/api/podcasts';

export default function TrashPage() {
    const [deletedSeries, setDeletedSeries] = useState([]);
    const [deletedEpisodes, setDeletedEpisodes] = useState([]);
    const [activeTab, setActiveTab] = useState('series'); // 'series' or 'episodes'
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchData(token);
    }, []);

    const fetchData = async (token) => {
        setLoading(true);
        try {
            // ดึงข้อมูลทั้ง 2 ส่วน
            const resSeries = await fetch(`${API_SERIES}/trash`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resEpisodes = await fetch(`${API_PODCASTS}/trash`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resSeries.ok) setDeletedSeries(await resSeries.json());
            if (resEpisodes.ok) setDeletedEpisodes(await resEpisodes.json());

        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id, type) => {
        const token = localStorage.getItem('token');
        const url = type === 'series' ? `${API_SERIES}/${id}/restore` : `${API_PODCASTS}/${id}/restore`;

        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('กู้คืนสำเร็จ!');
                fetchData(token); // รีโหลดข้อมูล
            }
        } catch (error) {
            alert('กู้คืนไม่สำเร็จ');
        }
    };

    const handleForceDelete = async (id, type) => {
        if (!confirm('⚠️ คำเตือน: การลบนี้จะหายไปถาวร กู้คืนไม่ได้อีก คุณแน่ใจหรือไม่?')) return;

        const token = localStorage.getItem('token');
        const url = type === 'series' ? `${API_SERIES}/${id}/force` : `${API_PODCASTS}/${id}/force`;

        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData(token);
            }
        } catch (error) {
            alert('ลบถาวรไม่สำเร็จ');
        }
    };

    return (
        <Layout wide={true}>
            <div className="card max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-red-400 flex items-center gap-2">
                        🗑️ ถังขยะ (Trash)
                    </h1>
                    <button
                        onClick={() => router.push('/writer')}
                        className="text-sm text-gray-400 hover:text-white"
                    >
                        ← กลับไป Dashboard
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-700 mb-6">
                    <button
                        className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'series'
                            ? 'text-yellow-400 border-b-2 border-yellow-400'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        onClick={() => setActiveTab('series')}
                    >
                        เรื่องที่ลบ ({deletedSeries.length})
                    </button>
                    <button
                        className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'episodes'
                            ? 'text-yellow-400 border-b-2 border-yellow-400'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        onClick={() => setActiveTab('episodes')}
                    >
                        ตอนที่ลบ ({deletedEpisodes.length})
                    </button>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500 py-8">กำลังโหลดข้อมูล...</p>
                ) : (
                    <div className="space-y-4">
                        {activeTab === 'series' ? (
                            deletedSeries.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">ถังขยะว่างเปล่า</p>
                            ) : (
                                deletedSeries.map(item => (
                                    <div key={item._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-300 line-through">{item.title}</h3>
                                            <p className="text-xs text-gray-500">ลบเมื่อ: {new Date(item.deletedAt).toLocaleString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRestore(item._id, 'series')}
                                                className="px-3 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/40 text-sm"
                                            >
                                                ↺ กู้คืน
                                            </button>
                                            <button
                                                onClick={() => handleForceDelete(item._id, 'series')}
                                                className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40 text-sm"
                                            >
                                                ✕ ลบถาวร
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            deletedEpisodes.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">ถังขยะว่างเปล่า</p>
                            ) : (
                                deletedEpisodes.map(item => (
                                    <div key={item._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-300 line-through">{item.title}</h3>
                                            <p className="text-xs text-gray-500">
                                                จากเรื่อง: <span className="text-yellow-500">{item.series?.title || 'Unknown Series'}</span>
                                                | ลบเมื่อ: {new Date(item.deletedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRestore(item._id, 'episodes')}
                                                className="px-3 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/40 text-sm"
                                            >
                                                ↺ กู้คืน
                                            </button>
                                            <button
                                                onClick={() => handleForceDelete(item._id, 'episodes')}
                                                className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40 text-sm"
                                            >
                                                ✕ ลบถาวร
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}