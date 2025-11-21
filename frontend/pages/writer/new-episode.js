import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// 1. Import ReactQuill แบบ Dynamic (ปิด SSR)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/podcasts`;
const MAX_CHARS = 1500; // 💥 LIMIT: กำหนดลิมิตตัวอักษร


export default function NewEpisodePage() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [seriesId, setSeriesId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter()
    const quillRef = useRef(null);

    // 💥 คำนวณจำนวนตัวอักษร (ตัด HTML Tags ออก)
    const charCount = content.replace(/<[^>]+>/g, '').length;

    // ดึง 'seriesId' จาก URL Query
    useEffect(() => {
        if (router.isReady) {
            const { seriesId } = router.query;
            if (seriesId) {
                setSeriesId(seriesId);
            } else {
                alert("ไม่พบ ID ของเรื่อง (Series ID)!");
                router.push('/writer');
            }
        }
    }, [router.isReady, router.query, router]);

    // ฟังก์ชัน "บันทึก" (สร้าง "ตอน")
    const saveEpisode = async (e) => {
        e.preventDefault()

        // 💥 VALIDATION: เช็คความยาวตัวอักษร
        if (charCount > MAX_CHARS) {
            alert(`เนื้อหายาวเกินไป! (${charCount}/${MAX_CHARS}) กรุณาลดจำนวนข้อความ`);
            return;
        }

        if (!title || !content) {
            alert("กรุณากรอก 'ชื่อตอน' และ 'เนื้อหา' ให้ครบ")
            return
        }
        if (!seriesId) {
            alert("Error: ไม่พบ Series ID");
            return;
        }

        const token = localStorage.getItem('token')
        if (!token) { router.push('/login'); return; }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/${seriesId}`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            })

            if (res.ok) {
                router.push('/writer')
            } else {
                const data = await res.json();
                alert(data.message || "บันทึกไม่สำเร็จ");
            }
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setSubmitting(false);
        }
    }

    // 💥 FIX: เพิ่มเมนู 'color' และ 'background' เข้าไปใน Toolbar
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
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background', 
        'list', 'bullet', 'indent',
        'align', 'link', 'image'
    ];

    return (
        <Layout wide={true}>
            <div className="max-w-4xl mx-auto mt-6 pb-24">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    📝 เพิ่มตอนใหม่ 
                </h2>

                <form onSubmit={saveEpisode} className="flex flex-col gap-6">

                    {/* Title Input */}
                    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
                        <label className="block text-gray-300 text-sm font-bold mb-2">ชื่อตอน (Episode Title)</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-yellow-500 transition-colors text-lg font-semibold"
                            placeholder="เช่น ตอนที่"
                            required
                        />
                    </div>

                    {/* 💥 A4 Paper Editor Area */}
                    <div className="flex justify-center bg-gray-800/50 p-8 rounded-xl border border-gray-700 overflow-x-auto relative">
                        <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl relative">
                            {/* CSS เฉพาะสำหรับหน้ากระดาษ */}
                            <style>{`
                                .ql-container { font-size: 16px; min-height: 297mm; font-family: 'Sarabun', sans-serif; border: none !important; }
                                .ql-editor { min-height: 297mm; padding: 25mm 20mm; } /* ระยะขอบแบบ A4 */
                                .ql-toolbar { 
                                    background-color: #f3f4f6; 
                                    border-bottom: 1px solid #e5e7eb !important; 
                                    border-top: none !important; 
                                    border-left: none !important; 
                                    border-right: none !important;
                                    position: sticky; top: 0; z-index: 10; 
                                }
                                /* ปรับแต่ง Dropdown สีให้ดูสวยขึ้น */
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
                            />
                        </div>
                    </div>

                    {/* 💥 Fixed Bottom Bar: ตัวนับคำ & ปุ่มบันทึก */}
                    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-50 flex justify-between items-center px-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">

                        {/* Character Counter */}
                        <div className={`text-sm font-bold px-4 py-2 rounded-lg border transition-colors duration-300 ${charCount > MAX_CHARS
                                ? 'bg-red-900/80 text-red-200 border-red-500 animate-pulse'
                                : 'bg-gray-800 text-green-400 border-gray-700'
                            }`}>
                            ตัวอักษร: {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                            {charCount > MAX_CHARS && <span className="ml-2">(เกินกำหนด!)</span>}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/writer')}
                                className="px-6 py-2 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
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
                                    ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                disabled={submitting || charCount > MAX_CHARS}
                            >
                                {submitting ? 'กำลังบันทึก...' : 'บันทึกตอนใหม่'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    )
}