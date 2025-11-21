import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout'
import Link from 'next/link'

// 1. 🛠️ FIX: URL ต้องชี้ไปที่ Public Series API (สำหรับระบบเลื่อนอ่าน)
const API_URL_PUBLIC = 'http://localhost:5000/api/series/public'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 2. 🛠️ FIX: State สำหรับ Top Post และ Other Popular
  const [topPost, setTopPost] = useState(null);
  const [otherPopular, setOtherPopular] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // 3. ตรวจสอบสถานะ Login (เหมือนเดิม)
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // 4. 🛠️ FIX: ดึงข้อมูล Series (เรื่องแม่) ทั้งหมด
    fetch(API_URL_PUBLIC)
      .then(r => {
        if (!r.ok) return [];
        return r.json();
      })
      .then(allSeries => {
        if (Array.isArray(allSeries)) {
          const filtered = allSeries.filter(s => s.likes && s.likes.length >= 3);

          // 6. 🛠️ FIX: จัดเรียง (Sort) จากไลค์มากไปน้อย
          const sorted = filtered.sort((a, b) => b.likes.length - a.likes.length);

          // 7. 🛠️ FIX: ตั้งค่า State (TopPost และ OtherPopular)
          setTopPost(sorted[0] || null); // อันดับ 1
          setOtherPopular(sorted.slice(1)); // อันดับ 2 ลงไปทั้งหมด
        }
      })
      .catch(err => {
        console.error("Failed to fetch popular series:", err);
      });

  }, []); // (รันครั้งเดียวเมื่อโหลดหน้า)

  // (ฟังก์ชัน Logout ไม่มีการเปลี่ยนแปลง)
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('_id');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    router.push('/');
  };

  // 8. 🛠️ FIX: ฟังก์ชัน 'renderPostCard' (สำหรับแสดงการ์ด)
  const renderPostCard = (post) => (
    <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition duration-150 h-full cursor-pointer">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-primary truncate">{post.title}</h3>
        <span className="flex-shrink-0 px-2 py-0.5 bg-purple-600 text-purple-100 rounded-full text-xs">
          {post.category || 'Other'}
        </span>
      </div>
      <p className="text-gray-400 text-sm mt-1">{post.desc}</p>
      <div className="text-sm text-red-400 mt-3">
        ❤️ {post.likes ? post.likes.length : 0} ไลค์
      </div>
    </div>
  );

  // 9. 💥 NEW: ฟังก์ชันสำหรับแสดง "Top Post" (กล่อง Featured)
  const renderTopPost = (post) => (
    <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-lg p-4 hover:opacity-90 transition duration-150 cursor-pointer">
      <div className="flex justify-between items-center text-sm text-gray-100">
        {/* {post.likes.length} ไลค์ */}
        <span>🔥 ยอดนิยมสูงสุด </span>
        <span className="px-2 py-0.5 bg-purple-600 text-purple-100 rounded-full text-xs">
          {post.category || 'Other'}
        </span>
      </div>
      <h3 className="text-white font-semibold mt-2 truncate">{post.title}</h3>
      <p className="text-gray-200 text-sm mt-1 truncate">{post.desc}</p>
    </div>
  );


  return (
    <Layout>
      <div className="card flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white">อ่านเรื่องราวที่คุณสนใจ</h1>
          <p className="text-gray-400 mt-3">เว็บเพจ content การอ่านที่มีระบบล็อกอินและแดชบอร์ดผู้ดูแล</p>
        </div>

        {/* 10. 🛠️ FIX: นำกล่อง "Top Post" (Featured) กลับมา */}
        <div className="w-64 flex-shrink-0">
          {topPost ? (
            isLoggedIn ? (
              <Link href={`/play/${topPost._id}`} legacyBehavior>
                <a>{renderTopPost(topPost)}</a>
              </Link>
            ) : (
              <div
                onClick={() => router.push('/login')}
                title="กรุณาล็อกอินเพื่ออ่าน"
              >
                {renderTopPost(topPost)}
              </div>
            )
          ) : (
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">ยังไม่มีบทความยอดนิยม</p>
            </div>
          )}
        </div>
      </div>

      {/* 11. 🛠️ FIX: เปลี่ยนกลับไปแสดง 'otherPopular' (ที่เหลือ) */}
      {otherPopular.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            บทความยอดนิยมอื่น ๆ 
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {otherPopular.map(p => (
              isLoggedIn ? (
                // (ต้องใช้ legacyBehavior เพราะเรามี <a> อยู่ข้างใน)
                <Link href={`/play/${p._id}`} key={p._id} legacyBehavior>
                  <a>{renderPostCard(p)}</a>
                </Link>
              ) : (
                <div
                  key={p._id}
                  onClick={() => router.push('/login')}
                  title="กรุณาล็อกอินเพื่ออ่าน"
                >
                  {renderPostCard(p)}
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}