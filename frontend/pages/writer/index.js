import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout' // ตรวจสอบ path ให้ตรงกับ project ของคุณ

const API_URL = 'http://localhost:5000/api/series'

export default function WriterDashboard() {
    const [list, setList] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    useEffect(() => {
        if (!router.isReady) return;

        const token = localStorage.getItem('token')
        const role = localStorage.getItem('role')

        if (!token || role !== 'writer') {
            router.push('/login')
            return
        }
        refresh(token)
    }, [router.isReady])

    function refresh(token) {
        const currentToken = token || localStorage.getItem('token');

        fetch(API_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        })
            .then(async r => {
                if (r.status === 204) return []; // จัดการกรณีไม่มีข้อมูล
                if (!r.ok) {
                    const errorData = await r.json();
                    throw new Error(errorData.message || `API failed with status ${r.status}`);
                }
                return r.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setList(data);
                } else {
                    setList([]);
                }
            })
            .catch(err => console.error("Fetch Error:", err));
    }

    const handleEditSeries = (seriesId) => {
        router.push(`/writer/edit-series/${seriesId}`);
    };

    async function removeSeries(id) {
        // แจ้งเตือนผู้ใช้ก่อนลบ
        if (list.length > 0 && !window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเรื่องนี้? (สามารถกู้คืนได้ในถังขยะ)")) {
            return;
        }
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) refresh(token);
            else {
                const errData = await res.json();
                alert(`ลบไม่สำเร็จ: ${errData.message || 'ตรวจสอบ Backend'}`);
            }
        } catch (e) {
            alert(`ลบไม่สำเร็จ: Error Status`);
        }
    }

    // 🔍 ฟังก์ชันกรองรายการ (Search Filter)
    const filteredList = list.filter(series => {
        const query = searchTerm.toLowerCase();
        return (
            series.title.toLowerCase().includes(query) ||
            series.desc.toLowerCase().includes(query)
        );
    });

    return (
        <Layout>
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Writer Dashboard</h2>
                    <div className="flex gap-3">
                        {/* ปุ่มไปหน้าถังขยะ */}
                        <button onClick={() => router.push('/writer/trash')} className="btn-ghost text-red-400 border-red-500/50 hover:bg-red-500/10">
                            🗑️ ถังขยะ
                        </button>
                        {/* ปุ่มสร้างเรื่องใหม่ */}
                        <button onClick={() => router.push('/writer/new-series')} className="btn-primary">
                            ➕ สร้างเรื่องใหม่
                        </button>
                    </div>
                </div>

                {/* ช่องค้นหา */}
                <input
                    type="text"
                    placeholder="ค้นหาเรื่องราว..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 mb-6 bg-gray-700 border border-gray-600 rounded-lg focus:ring-primary focus:border-primary"
                />

                <p className="text-sm text-gray-400 mt-1 mb-4">แสดง {filteredList.length} จาก {list.length} เรื่อง</p>

                <div className="space-y-4">
                    {filteredList.length === 0 ? <p className="text-gray-500 text-center py-8">ไม่พบรายการ</p> :
                        filteredList.map(s => (
                            <div key={s._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg text-primary">{s.title}</h3>
                                            <span className="px-2 py-0.5 bg-purple-600 text-purple-100 rounded-full text-xs">{s.category || 'Other'}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">{s.desc}</p>

                                        {/* 💖 แสดงรายชื่อคนที่กดถูกใจ */}
                                        {s.likes && s.likes.length > 0 && (
                                            <div className="text-xs text-purple-300 mt-3 bg-purple-900/20 p-2 rounded-md inline-block border border-purple-500/20">
                                                <span className="font-bold mr-1">💖 ถูกใจโดย:</span>
                                                {s.likes.map((like, index) => {
                                                    const username = typeof like === 'object' ? like.username : 'Unknown User';
                                                    return (
                                                        <span key={like._id || index} className="text-purple-100 font-medium">
                                                            {username}{index < s.likes.length - 1 ? ', ' : ''}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* ปุ่มจัดการ */}
                                    <div className="flex-shrink-0 space-x-2">
                                        <button onClick={() => router.push(`/writer/new-episode?seriesId=${s._id}`)} className="btn-primary">➕ เพิ่มตอน</button>
                                        <button onClick={() => handleEditSeries(s._id)} className="btn-ghost text-yellow-400">แก้ไข</button>
                                        <button onClick={() => removeSeries(s._id)} className="btn-ghost text-red-400">ลบ</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </Layout>
    )
}