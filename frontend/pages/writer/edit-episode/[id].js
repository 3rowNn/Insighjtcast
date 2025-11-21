import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../../../components/Layout'; 
import 'react-quill/dist/quill.snow.css';

// สร้าง Component แบบ Dynamic (ปิด SSR)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL_PODCASTS = `${BASE_URL}/api/podcasts`;
const MAX_CHARS = 1500; //  LIMIT: กำหนดลิมิตตัวอักษร

export default function EditEpisodePage() {
    const router = useRouter();
    const { id: episodeId } = router.query;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const quillRef = useRef(null);

    // คำนวณจำนวนตัวอักษร (ตัด HTML Tags ออกเพื่อนับเฉพาะข้อความ)
    const charCount = content.replace(/<[^>]+>/g, '').length;

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const formats = [
        'header', 'bold', 'italic', 'underline', 'strike', 'color', 'background',
        'list', 'bullet', 'indent', 'align', 'link', 'image'
    ];

    // 1. ดึงข้อมูล Episode เดิมมาแสดง
    useEffect(() => {
        if (!episodeId || !router.isReady) return;

        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/login');
            return;
        }

        const fetchEpisode = async () => {
            try {
                const res = await fetch(`${API_URL_PODCASTS}/${episodeId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
                    }
                    throw new Error('ไม่พบข้อมูล Episode');
                }

                const data = await res.json();
                setTitle(data.title);
                setContent(data.content);
                setLoading(false);

            } catch (err) {
                console.error("Error fetching episode:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchEpisode();
    }, [episodeId, router.isReady]);

    // 2. ฟังก์ชันบันทึกการแก้ไข
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 💥 VALIDATION
        if (charCount > MAX_CHARS) {
            alert(`เนื้อหายาวเกินไป! กรุณาลดจำนวนตัวอักษรให้เหลือไม่เกิน ${MAX_CHARS} (ปัจจุบัน ${charCount})`);
            return;
        }

        setSubmitting(true);
        setError(null);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_URL_PODCASTS}/${episodeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'แก้ไขไม่สำเร็จ');
            }

            alert('✅ แก้ไขข้อมูลเรียบร้อยแล้ว!');
            router.back();

        } catch (err) {
            console.error("Update error:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64 text-gray-400 animate-pulse">
                    กำลังโหลดข้อมูล...
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto mt-10 text-center">
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
                        <h3 className="font-bold text-lg mb-2">เกิดข้อผิดพลาด</h3>
                        <p>{error}</p>
                        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">ย้อนกลับ</button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout wide={true}>
            <div className="max-w-4xl mx-auto mt-6 pb-20">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    ✏️ แก้ไขตอน 
                </h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Title Input */}
                    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
                        <label className="block text-gray-300 text-sm font-bold mb-2">
                            ชื่อตอน (Title)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-yellow-500 transition-colors text-lg font-semibold"
                            placeholder="ใส่ชื่อตอน..."
                            required
                        />
                    </div>

                    {/* A4 Paper Editor Area */}
                    <div className="flex justify-center bg-gray-800/50 p-8 rounded-xl border border-gray-700 overflow-x-auto relative">
                        <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl relative">
                            <style>{`
                                .ql-container { font-size: 16px; min-height: 297mm; font-family: 'Sarabun', sans-serif; border: none !important; }
                                .ql-editor { min-height: 297mm; padding: 25mm 20mm; }
                                .ql-toolbar { 
                                    background-color: #f3f4f6; 
                                    border-bottom: 1px solid #e5e7eb !important; 
                                    border-top: none !important; 
                                    border-left: none !important; 
                                    border-right: none !important;
                                    position: sticky; top: 0; z-index: 10; 
                                }
                                .ql-color-picker .ql-picker-label { padding-left: 4px; }
                            `}</style>
                            <ReactQuill
                                ref={quillRef}
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                modules={modules}
                                formats={formats}
                                className="h-full"
                                placeholder="เริ่มเขียนนิยายของคุณที่นี่..."
                            />
                        </div>
                    </div>

                    {/* Counter UI & Actions */}
                    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-50 flex justify-between items-center px-8 shadow-2xl">
                        <div className={`text-sm font-bold px-4 py-2 rounded-lg border ${charCount > MAX_CHARS ? 'bg-red-900/80 text-red-200 border-red-500 animate-pulse' : 'bg-gray-800 text-green-400 border-gray-700'}`}>
                            ตัวอักษร: {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                            {charCount > MAX_CHARS && <span className="ml-2">(เกินกำหนด!)</span>}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                                disabled={submitting}
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className={`px-8 py-2 font-bold rounded shadow-lg transition-all transform 
                                    ${charCount > MAX_CHARS
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 hover:scale-105'} 
                                    ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={submitting || charCount > MAX_CHARS}
                            >
                                {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
}