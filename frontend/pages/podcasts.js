import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Link from 'next/link'

// 1. API URLs
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const API_URL_PUBLIC = `${BASE_URL}/api/series/public`;
const API_URL_PROTECTED = `${BASE_URL}/api/series`;

// 💥 NEW: กำหนดหมวดหมู่และลำดับที่จะแสดง
const CATEGORIES = ['Tech', 'Life', 'News', 'Story', 'Other'];

// 2. ฟังก์ชันถอดรหัส JWT
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

export default function Podcasts() {
  const [list, setList] = useState([]) // list of Series
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // 3. ดึง userId จาก Token
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = decodeJwt(token)
      if (decoded) setUserId(decoded.id)
    }

    // 4. Fetch list ของ Series
    setIsLoading(true)
    fetch(API_URL_PUBLIC)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const updatedList = data.map(s => ({
            ...s,
            likes: Array.isArray(s.likes) ? s.likes.map(id => id.toString()) : []
          }))
          setList(updatedList)
        } else setList([])
      })
      .catch(() => setList([]))
      .finally(() => setIsLoading(false))
  }, [])

  // 5. ฟังก์ชันแชร์
  const handleShare = series => {
    const shareUrl = `${window.location.origin}/play/${series._id}`
    if (navigator.share) {
      navigator.share({ title: series.title, url: shareUrl })
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('คัดลอกลิงก์เรียบร้อยแล้ว!'))
        .catch(err => console.error(err))
    }
  }

  // 6. ฟังก์ชันไลค์
  const handleLikeSeries = async seriesId => {
    const token = localStorage.getItem('token')
    if (!token || !userId) {
      router.push('/login')
      return
    }

    // Optimistic UI
    setList(prevList =>
      prevList.map(s => {
        if (s._id === seriesId) {
          const isLiked = s.likes.includes(userId.toString())
          return {
            ...s,
            likes: isLiked
              ? s.likes.filter(id => id !== userId.toString())
              : [...s.likes, userId.toString()]
          }
        }
        return s
      })
    )

    try {
      const res = await fetch(`${API_URL_PROTECTED}/${seriesId}/like`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        console.error('Like failed, rolling back UI.')
        // Rollback
        const r = await fetch(API_URL_PUBLIC)
        const data = await r.json()
        const updatedList = data.map(s => ({
          ...s,
          likes: Array.isArray(s.likes) ? s.likes.map(id => id.toString()) : []
        }))
        setList(updatedList)
      }
    } catch (err) {
      console.error(err)
    }

  }

  // กรองรายการตามคำค้นหา (Search)
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
        <h2 className="text-2xl font-semibold">รายการเรื่องราวทั้งหมด</h2>

        {/* แถบค้นหา */}
        <input
          type="text"
          placeholder="ค้นหาเรื่องราว"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 mt-4 mb-6 bg-gray-700 border border-gray-600 rounded-lg focus:ring-primary focus:border-primary"
        />

        {/* ส่วนแสดงผล */}
        {isLoading ? (
          <p className="text-gray-400 mt-4 text-center">กำลังโหลด...</p>
        ) : filteredList.length === 0 ? (
          <p className="text-gray-400 mt-4 text-center">ไม่พบเรื่องราวที่ตรงกับคำค้นหา</p>
        ) : (
          //  วนลูปแสดงตามหมวดหมู่
          <div className="space-y-10 mt-4">
            {CATEGORIES.map(categoryName => {
              // กรอง Series ที่อยู่ในหมวดหมู่นี้
              const categorySeries = filteredList.filter(s => (s.category || 'Other') === categoryName);

              // ถ้าไม่มี Series ในหมวดนี้ ให้ข้ามไป (ไม่แสดงหัวข้อเปล่าๆ)
              if (categorySeries.length === 0) return null;

              return (
                <div key={categoryName}>
                  {/* หัวข้อหมวดหมู่ */}
                  <h3 className="text-xl font-bold text-yellow-400 mb-4 border-l-4 border-yellow-500 pl-3">
                    {categoryName} <span className="text-gray-500 text-sm font-normal">({categorySeries.length})</span>
                  </h3>

                  {/* Grid ของ Series ในหมวดนี้ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categorySeries.map(s => {
                      const isLikedByMe = userId && s.likes.includes(userId.toString())
                      return (
                        <div key={s._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-white">{s.title}</h3>

                                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                                  {s.category || 'Other'}
                                </span>
                                
                              </div>
                              <p className="text-gray-400 text-sm mt-2 line-clamp-2">{s.desc}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                โดย: <span className="text-gray-300">{s.author?.username || 'N/A'}</span>
                              </p>

                              <div className="mt-4 flex gap-2 items-center">
                                <Link href={`/play/${s._id}`} className="btn-primary inline-block text-sm px-4 py-1.5">
                                  อ่านเลย
                                </Link>
                                <button onClick={() => handleShare(s)} className="btn-ghost text-sm px-3 py-1.5">
                                  แชร์
                                </button>
                                <button
                                  onClick={() => handleLikeSeries(s._id)}
                                  className={`btn-ghost text-sm px-3 py-1.5 flex items-center gap-1 ${isLikedByMe ? 'text-red-500' : 'text-gray-400'}`}
                                >
                                  {'❤️'} {s.likes.length}

                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}