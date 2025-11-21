import React, { useState, useEffect } from 'react';

const API_URL_NOTIFICATIONS = 'http://localhost:5000/api/notifications';

export default function Layout({ children, wide = false }) {
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // State สำหรับเก็บแจ้งเตือนที่กำลังเปิดอ่าน (Popup)
  const [selectedNoti, setSelectedNoti] = useState(null);

  // 1. useEffect เดียวสำหรับจัดการ Auth และ Fetch Data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);

      // ดึงการแจ้งเตือน
      fetch(API_URL_NOTIFICATIONS, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
        }
      })
      .catch(err => console.error("Failed to fetch notifications:", err));
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('_id');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUserRole(null);
    window.location.href = '/';
  };

  // 2. ฟังก์ชันจัดการเมื่อคลิกแจ้งเตือน (เปิด Popup + Mark as Read)
  const handleNotificationClick = async (notif) => {
    // เปิด Popup ทันที
    setSelectedNoti(notif);
    setShowNotiDropdown(false); // ปิด Dropdown

    // ถ้ายังไม่อ่าน -> ทำการมาร์คว่าอ่านแล้ว
    if (!notif.isRead) {
        // A. อัปเดตตัวเลขแดงๆ (Badge) ลดลง 1 ทันที
        setUnreadCount(prev => Math.max(0, prev - 1));

        // B. อัปเดตลิสต์รายการในหน้าจอให้เป็น "อ่านแล้ว" (เปลี่ยนสี)
        setNotifications(prev => 
            prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
        );

        // C. ส่ง API ไปบอก Backend (ทำเงียบๆ)
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL_NOTIFICATIONS}/${notif._id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    }
  };

  return (
    <>
      {/* แทนที่จะใช้ Head ของ Next.js เราใช้ div ธรรมดา หรือปล่อยว่างไว้ใน preview mode */}
      <div className="min-h-screen flex flex-col relative font-sans text-gray-200 bg-gray-900">
        {/* Navbar */}
        <header className="bg-gray-900 border-b border-gray-800 relative z-50">
          <div className={`mx-auto px-4 py-4 flex items-center justify-between ${wide ? 'max-w-7xl' : 'max-w-5xl'}`}>
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-purple-500">💡 InsightCast</div>
            </div>

            {/* Navigation - ใช้ <a> แทน Link ของ Next.js */}
            <nav className="flex items-center gap-4">
              <a href="/" className="text-gray-200 hover:text-white">Home</a>
              {isLoggedIn && <a href="/podcasts" className="text-gray-200 hover:text-white">InsightCast</a>}
              {userRole === 'admin' && <a href="/admin" className="text-gray-200 hover:text-white">Administrator</a>}
              {userRole === 'writer' && <a href="/writer" className="text-gray-200 hover:text-white">Writer Dashboard</a>}

              {isLoggedIn ? (
                <>
                  {/* 🔔 Bell Icon & Dropdown Container */}
                  <div className="relative">
                    <button 
                        type="button"
                        onClick={() => setShowNotiDropdown(!showNotiDropdown)}
                        className="relative p-2 text-gray-300 hover:text-white focus:outline-none"
                    >
                        <span className="text-xl">🔔</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dropdown List */}
                    {showNotiDropdown && (
                        <>
                            {/* Overlay ใสสำหรับปิด Dropdown เมื่อกดข้างนอก */}
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotiDropdown(false)}></div>

                            <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
                                <div className="p-3 border-b border-gray-700 font-semibold text-white flex justify-between items-center bg-gray-800 sticky top-0">
                                    <span>การแจ้งเตือน</span>
                                    <button onClick={() => setShowNotiDropdown(false)} className="text-xs text-gray-400 hover:text-white">ปิด</button>
                                </div>
                                
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">ไม่มีการแจ้งเตือน</div>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n._id} 
                                            // 💥 Style แยกตามสถานะ: ถ้าอ่านแล้วจะจางลง
                                            className={`
                                                p-3 border-b border-gray-800 cursor-pointer transition-all 
                                                ${!n.isRead 
                                                    ? 'bg-gray-800 hover:bg-gray-700 border-l-4 border-l-purple-500' // ยังไม่อ่าน: เด่น
                                                    : 'bg-gray-900 text-gray-500 hover:bg-gray-800' // อ่านแล้ว: จาง
                                                }
                                            `}
                                            onClick={() => handleNotificationClick(n)}
                                        >
                                            <p className={`text-sm truncate ${!n.isRead ? 'text-white font-medium' : ''}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {new Date(n.createdAt).toLocaleString('th-TH')}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                  </div>

                  <button onClick={handleLogout} className="text-gray-200 hover:text-white">Logout</button>
                </>
              ) : (
                <>
                  <a href="/register" className="text-gray-200 hover:text-white">Register</a>
                  <a href="/login" className="text-gray-200 hover:text-white">Login</a>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 mx-auto px-4 py-8 w-full ${wide ? 'max-w-7xl' : 'max-w-5xl'} relative z-0`}>
          {children}
        </main>

        {/* 💥 Popup Modal สำหรับแสดงรายละเอียดแจ้งเตือน */}
        {selectedNoti && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100 p-6 animate-fadeIn">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                           📩 ข้อความ
                        </h3>
                        <button 
                            onClick={() => setSelectedNoti(null)}
                            className="text-gray-400 hover:text-white text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>
                    
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-4 max-h-[60vh] overflow-y-auto">
                        <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">
                            {selectedNoti.message}
                        </p>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-700 pt-4">
                        <span className="bg-gray-700 px-2 py-1 rounded">
                            {selectedNoti.type === 'announcement' ? '📢 ประกาศ' : '👤 ส่วนตัว'}
                        </span>
                        <span>
                            {new Date(selectedNoti.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                    </div>

                    <button 
                        onClick={() => setSelectedNoti(null)}
                        className="mt-6 w-full py-2 bg-yellow-500 text-gray-900 hover:bg-yellow-400 rounded-lg transition-colors font-bold text-sm"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        )}

      </div>
    </>
  );
}