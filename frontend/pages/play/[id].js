import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout' 
import Link from 'next/link' 

// 1. ฟังก์ชันถอดรหัส JWT (Token)
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

// 2. API URL
const API_URL_EPISODES = 'http://localhost:5000/api/podcasts';
const API_URL_SERIES = 'http://localhost:5000/api/series';

export default function PlayPage() {
  const router = useRouter()
  const { id } = router.query // SERIES_ID
  
  const [seriesData, setSeriesData] = useState(null); 
  const [episodesData, setEpisodesData] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 

  // Report Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate'); 
  const [reportDetails, setReportDetails] = useState(''); 
  const [reportMessage, setReportMessage] = useState(''); 
  const [reportingEpisodeId, setReportingEpisodeId] = useState(null);
  
  // แยกช่องใส่ชื่อเรื่อง และ ชื่อตอน
  const [reportSeriesInput, setReportSeriesInput] = useState(''); 
  const [reportEpisodeInput, setReportEpisodeInput] = useState(''); 
  const [reportAuthorInput, setReportAuthorInput] = useState(''); 
  
  // Comment States
  const [episodeComments, setEpisodeComments] = useState({}); 
  const [seriesComments, setSeriesComments] = useState([]);
  const [newSeriesComment, setNewSeriesComment] = useState(""); 
  
  const [currentUser, setCurrentUser] = useState(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!id) return 

    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const decoded = decodeJwt(token);
      setCurrentUser(decoded);
    } else {
      setIsLoggedIn(false);
    }

    setIsLoading(true); 
    
    // ดึงข้อมูล
    fetch(`${API_URL_SERIES}/public/${id}`)
      .then(r => {
        if (!r.ok) return null;
        return r.json()
      })
      .then(data => {
        if (data && data.seriesData) {
          setSeriesData(data.seriesData); 
          setEpisodesData(data.episodesData || []); 
        }
      })
      .catch(err => console.error('Error loading series:', err))
      .finally(() => setIsLoading(false)); 
      
    // ดึงคอมเมนต์
    fetch(`${API_URL_SERIES}/public/${id}/comments`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSeriesComments(data);
      })
      .catch(err => console.error('Error loading series comments:', err));

  }, [id]);

  // ฟังก์ชัน "ส่ง Report"
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportingEpisodeId) return; 

    // VALIDATION
    if (!reportSeriesInput.trim() || !reportEpisodeInput.trim() || !reportAuthorInput.trim()) {
        alert("กรุณาระบุ 'ชื่อเรื่อง', 'ชื่อตอน' และ 'ชื่อผู้เขียน' ให้ครบถ้วน");
        return;
    }

    setReportMessage(''); 
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login'); 
      return;
    }

    try {
      const fullDetails = `[Series: ${reportSeriesInput}] [Episode: ${reportEpisodeInput}] [Author: ${reportAuthorInput}]\nDetails: ${reportDetails}`;

      const res = await fetch(`${API_URL_EPISODES}/${reportingEpisodeId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reportReason, details: fullDetails })
      });

      const data = await res.json();
      
      if (res.ok) {
        setReportMessage('✅ Report submitted successfully! Admin จะตรวจสอบในไม่ช้า'); 
        setTimeout(() => {
          setShowReportModal(false); 
          setReportingEpisodeId(null); 
        }, 3000); 
      } else {
        setReportMessage(`❌ Error: ${data.message || 'ส่งรายงานไม่สำเร็จ'}`);
      }
    } catch (err) {
      setReportMessage('❌ Network error. Please try again.');
    }
  };

  // เปิด Modal พร้อมเติมข้อมูลแยกช่อง
  const openReportModal = (episodeId, episodeTitle, authorName) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setReportingEpisodeId(episodeId);
    
    // Pre-fill ข้อมูล
    setReportSeriesInput(seriesData?.title || ''); // ใส่ชื่อเรื่องแม่
    setReportEpisodeInput(episodeTitle || '');     // ใส่ชื่อตอน
    setReportAuthorInput(authorName || '');
    
    setShowReportModal(true);
  };

  // ฟังก์ชันลบ Episode
  const handleDeleteEpisode = async (episodeId, title) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ Episode: "${title}"?`)) return; 

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login'); 
      return;
    }
    
    try {
      const res = await fetch(`${API_URL_EPISODES}/${episodeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert(`Episode "${title}" ถูกลบแล้ว`);
        setEpisodesData(episodesData.filter(ep => ep._id !== episodeId));
      } else {
        const data = await res.json();
        alert(`❌ Error: ${data.message || 'ไม่สามารถลบ Episode ได้'}`);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบ Episode");
    }
  };

  // ฟังก์ชันส่ง Comment Series
  const handleSeriesCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newSeriesComment.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL_SERIES}/${id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newSeriesComment })
      });
      
      if (res.ok) {
        const addedComment = await res.json();
        setSeriesComments([...seriesComments, addedComment]); 
        setNewSeriesComment(""); 
      } else {
        console.error("Failed to post series comment");
      }
    } catch (err) {
      console.error("Error posting series comment:", err);
    }
  };
  
  // ฟังก์ชันลบ Comment Series
  const handleDeleteSeriesComment = async (commentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL_SERIES}/${id}/comment/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setSeriesComments(seriesComments.filter(c => c._id !== commentId)); 
      } else {
        const data = await res.json();
        alert(`❌ Error: ${data.message || 'ไม่สามารถลบคอมเมนต์ได้'}`);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบคอมเมนต์");
    }
  };

  if (isLoading || !seriesData) { 
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-400 animate-pulse">กำลังโหลดเรื่องราว...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* ส่วนหัว "เรื่องแม่" */}
      <div className="max-w-3xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-800 mt-6 relative">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl font-extrabold text-purple-400 leading-snug">
            {seriesData.title}
          </h1>
          <span className="px-3 py-1 bg-purple-600 text-purple-100 rounded-full text-sm">
            {seriesData.category || 'Other'}
          </span>
        </div>
        {seriesData.author && (
          <p className="text-sm text-gray-500 mb-4">
            โดย: {seriesData.author.username || 'ผู้ใช้ไม่ระบุตัวตน'}
          </p>
        )}
        <p className="text-gray-400 italic mb-6 border-l-4 border-purple-400 pl-3">
          {seriesData.desc}
        </p>
      </div>

      {/* ส่วน "เลื่อนอ่าน" (Episode List) */}
      {episodesData.length > 0 ? (
        episodesData.map(ep => {
          const isEpisodeAuthor = currentUser && (currentUser.id === ep.author?._id);
          const isAdmin = currentUser && currentUser.role === 'admin';
          const canManage = isEpisodeAuthor || isAdmin; 
          const authorName = ep.author?.username || 'Unknown';

          return (
            <div key={ep._id} className="max-w-3xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-800 mt-6 relative">
              {canManage && (
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button 
                    onClick={() => router.push(`/writer/edit-episode/${ep._id}`)}
                    className="text-xs text-yellow-400 hover:text-white"
                    title="Edit Episode"
                  >
                    ✏️ แก้ไข
                  </button>
                  <button 
                    onClick={() => handleDeleteEpisode(ep._id, ep.title)}
                    className="text-xs text-red-400 hover:text-white"
                    title="Delete Episode"
                  >
                    🗑️ ลบ
                  </button>
                </div>
              )}
              
              {isLoggedIn && !canManage && (
                <button 
                  onClick={() => openReportModal(ep._id, ep.title, authorName)}
                  className="absolute top-4 right-4 text-xs text-gray-500 hover:text-red-400 transition-colors"
                  title="Report this episode"
                >
                  🚩 Report Episode
                </button>
              )}

              <h2 className="text-2xl font-semibold text-white mb-4">
                {ep.title}
              </h2>
              <article
                className="prose prose-invert max-w-none text-gray-200 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: ep.content || '' }}
              />
            </div>
          )
        })
      ) : (
        <div className="max-w-3xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-800 mt-6">
          <p className="text-gray-500">ยังไม่มี "ตอน" ในเรื่องนี้</p>
        </div>
      )}

      {/* ปุ่มย้อนกลับ */}
      <div className="mt-10 text-center">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-purple-500 hover:bg-purple-400 text-black font-semibold rounded-full transition duration-200 shadow-md"
        >
          ← กลับไปหน้ารายการ
        </button>
      </div>

      {/* คอมเมนต์ Series */}
      <div className="max-w-3xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-800 mt-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          แสดงความคิดเห็น ({seriesComments.length})
        </h2>

        {isLoggedIn ? (
          <form onSubmit={handleSeriesCommentSubmit} className="mb-6">
            <textarea
              value={newSeriesComment}
              onChange={(e) => setNewSeriesComment(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              rows="3"
              placeholder="Write a comment..."
            />
            <div className="text-right mt-2">
              <button type="submit" className="btn-primary">
                Post Comment
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 text-center text-gray-400">
            Please <Link href="/login" className="text-primary hover:underline">log in</Link> to post a comment.
          </div>
        )}

        <div className="space-y-4">
          {seriesComments.length > 0 ? (
            seriesComments.map(comment => {
              const canDelete = currentUser && (
                currentUser.id === (comment.author?._id || null) || 
                currentUser.role === 'admin' 
              );

              return (
                <div key={comment._id} className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {/* 💥 FIX: Safe access for username substring */}
                    {comment.author && comment.author.username 
                      ? comment.author.username.substring(0, 1).toUpperCase() 
                      : '?'}
                  </div>
                  <div className="flex-1 bg-gray-800 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-primary text-sm">
                        {comment.author ? comment.author.username : '[Deleted User]'}
                      </p>
                      {canDelete && (
                        <button 
                          onClick={() => handleDeleteSeriesComment(comment._id)}
                          className="text-xs text-gray-500 hover:text-red-400"
                          title="Delete comment"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-300 mt-1">{comment.text}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-gray-500 text-sm">No comments on this series yet.</p>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">รายงานปัญหา (Report)</h3>
            
            <form onSubmit={handleReportSubmit}>
              
              {/* 💥 NEW: ช่องใส่ชื่อเรื่อง (แยกออกมา) */}
              <div className="mb-4">
                <label className="text-sm text-gray-300 mb-1 block">ชื่อเรื่อง (Series Title) <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={reportSeriesInput}
                  onChange={(e) => setReportSeriesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-primary focus:outline-none"
                  placeholder="ระบุชื่อเรื่อง"
                  required
                />
              </div>

              {/* 💥 NEW: ช่องใส่ชื่อตอน (แยกออกมา) */}
              <div className="mb-4">
                <label className="text-sm text-gray-300 mb-1 block">ชื่อตอน (Episode Title) <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={reportEpisodeInput}
                  onChange={(e) => setReportEpisodeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-primary focus:outline-none"
                  placeholder="ระบุชื่อตอน"
                  required
                />
              </div>

              {/* ช่องใส่ชื่อผู้เขียน */}
              <div className="mb-4">
                <label className="text-sm text-gray-300 mb-1 block">ชื่อผู้เขียน <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={reportAuthorInput}
                  onChange={(e) => setReportAuthorInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-primary focus:outline-none"
                  placeholder="ระบุชื่อผู้เขียน"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="text-sm text-gray-300 mb-1 block">เหตุผล <span className="text-red-500">*</span></label>
                <select 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-primary"
                >
                  <option value="Inappropriate">เนื้อหาไม่เหมาะสม</option>
                  <option value="Spam">สแปม/หลอกลวง</option>
                  <option value="Broken">ลิงก์/รูปภาพเสีย</option>
                  <option value="Other">อื่นๆ</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-sm text-gray-300 mb-1 block">รายละเอียดเพิ่มเติม (ถ้ามี):</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-primary"
                  rows="3"
                  placeholder="บอกรายละเอียดเพิ่มเติม..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowReportModal(false)} 
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors">
                  ส่งรายงาน
                </button>
              </div>
              {reportMessage && (
                <p className="text-sm text-center mt-4 text-yellow-400 animate-pulse">{reportMessage}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}