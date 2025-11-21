import React, { useEffect, useState } from 'react'

// ==========================================
// 1. Helper Components & Icons (SVG)
// ==========================================
const Icons = {
    Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Report: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    Content: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    Trash: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Broadcast: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
    Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
};

// Simple Toast Component
const Toast = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className={`fixed bottom-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce-in z-[100]`}>
            <span>{message}</span>
            <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1"><Icons.X /></button>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center justify-between hover:border-gray-600 transition-all">
        <div>
            <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10 ${color === 'red' ? 'bg-red-500 text-red-400' : color === 'yellow' ? 'bg-yellow-500 text-yellow-400' : 'bg-blue-500 text-blue-400'}`}>
            <Icon />
        </div>
    </div>
);

// ==========================================
// 2. Layout Component
// ==========================================
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const API_URL_NOTIFICATIONS = `${BASE_URL}/api/notifications`;

const Layout = ({ children, wide = false }) => {
    const [userRole, setUserRole] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotiDropdown, setShowNotiDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedNoti, setSelectedNoti] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token) {
            setIsLoggedIn(true);
            setUserRole(role);
            fetch(API_URL_NOTIFICATIONS, { headers: { 'Authorization': `Bearer ${token}` } })
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
        localStorage.clear();
        window.location.href = '/';
    };

    const handleNotificationClick = async (notif) => {
        setSelectedNoti(notif);
        setShowNotiDropdown(false);
        if (!notif.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            const token = localStorage.getItem('token');
            try { await fetch(`${API_URL_NOTIFICATIONS}/${notif._id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } }); } catch (error) { }
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative font-sans text-gray-200 bg-gray-900">
            <header className="bg-gray-900 border-b border-gray-800 relative z-50">
                <div className={`mx-auto px-4 py-4 flex items-center justify-between ${wide ? 'max-w-[1440px]' : 'max-w-5xl'}`}>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold bg-clip-text  bg-gradient-to-r from-purple-400 to-pink-600">💡 InsightContent</div>
                    </div>
                    <nav className="flex items-center gap-6 text-sm font-medium">
                        <a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a>
                        {isLoggedIn && <a href="/podcasts" className="text-gray-400 hover:text-white transition-colors">InsightCast</a>}
                        {userRole === 'admin' && <a href="/admin" className="text-white border-b-2 border-purple-500 pb-1">Admin</a>}
                        {userRole === 'writer' && <a href="/writer" className="text-gray-400 hover:text-white transition-colors">Writer</a>}
                        {isLoggedIn ? (
                            <>
                                <div className="relative">
                                    <button onClick={() => setShowNotiDropdown(!showNotiDropdown)} className="relative p-2 text-gray-300 hover:text-white focus:outline-none">
                                        <span className="text-xl">🔔</span>
                                        {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{unreadCount}</span>}
                                    </button>
                                    {showNotiDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowNotiDropdown(false)}></div>
                                            <div className="absolute right-0 mt-3 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto ring-1 ring-black ring-opacity-5">
                                                <div className="p-4 border-b border-gray-700 font-semibold text-white flex justify-between items-center bg-gray-800 sticky top-0 z-10">
                                                    <span>การแจ้งเตือน</span>
                                                    <button onClick={() => setShowNotiDropdown(false)} className="text-xs text-gray-400 hover:text-white">ปิด</button>
                                                </div>
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2"><span className="text-2xl">📭</span><span>ไม่มีการแจ้งเตือน</span></div>
                                                ) : (
                                                    notifications.map(n => (
                                                        <div key={n._id} className={`p-4 border-b border-gray-700/50 cursor-pointer transition-all hover:bg-gray-700/50 ${!n.isRead ? 'bg-gray-700/20 border-l-4 border-l-purple-500' : 'text-gray-500'}`} onClick={() => handleNotificationClick(n)}>
                                                            <p className={`text-sm truncate ${!n.isRead ? 'text-gray-100 font-medium' : ''}`}>{n.message}</p>
                                                            <p className="text-[10px] mt-1 opacity-70">{new Date(n.createdAt).toLocaleString('th-TH')}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">Logout</button>
                            </>
                        ) : (
                            <>
                                <a href="/register" className="text-gray-400 hover:text-white transition-colors">Register</a>
                                <a href="/login" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-lg shadow-purple-900/20">Login</a>
                            </>
                        )}
                    </nav>
                </div>
            </header>
            <main className={`flex-1 mx-auto px-4 py-8 w-full ${wide ? 'max-w-[1440px]' : 'max-w-5xl'}`}>{children}</main>

            {/* Modal */}
            {selectedNoti && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100 transition-transform">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl">📩</span> รายละเอียดข้อความ</h3>
                            <button onClick={() => setSelectedNoti(null)} className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors">&times;</button>
                        </div>
                        <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700 mb-6 max-h-[50vh] overflow-y-auto">
                            <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{selectedNoti.message}</p>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-700 pt-4">
                            <span className={`px-2 py-1 rounded-md ${selectedNoti.type === 'announcement' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                                {selectedNoti.type === 'announcement' ? '📢 ประกาศ' : '👤 ส่วนตัว'}
                            </span>
                            <span>{new Date(selectedNoti.createdAt).toLocaleString('th-TH')}</span>
                        </div>
                        <button onClick={() => setSelectedNoti(null)} className="mt-6 w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">ปิดหน้าต่าง</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// 3. Admin Dashboard Logic (Refined UI)
// ==========================================
function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}

const API_URL_SERIES_PUBLIC = `${BASE_URL}/api/series/public`
const API_URL_ADMIN = `${BASE_URL}/api/admin`
const API_URL_SERIES = `${BASE_URL}/api/series`
const API_PODCASTS = `${BASE_URL}/api/podcasts`

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([])
    const [seriesList, setSeriesList] = useState([])
    const [reports, setReports] = useState([])
    const [deletedSeries, setDeletedSeries] = useState([]);
    const [deletedEpisodes, setDeletedEpisodes] = useState([]);

    const [isLoading, setIsLoading] = useState(true)
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetUser, setTargetUser] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [searchUser, setSearchUser] = useState('');
    const [searchContent, setSearchContent] = useState('');

    const [toast, setToast] = useState({ message: '', type: '' });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: '' }), 3000);
    };

    const reasonTranslator = {
        'Inappropriate': 'เนื้อหาไม่เหมาะสม', 'Spam': 'สแปม/หลอกลวง', 'Broken': 'ลิงก์/รูปภาพเสีย', 'Other': 'อื่นๆ'
    };

    const fetchData = async (token) => {
        setIsLoading(true);
        try {
            const resUsers = await fetch(`${API_URL_ADMIN}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (resUsers.ok) setUsers(await resUsers.json());

            const resReports = await fetch(`${API_URL_ADMIN}/reports`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (resReports.ok) setReports(await resReports.json());

            const resSeries = await fetch(API_URL_SERIES_PUBLIC);
            if (resSeries.ok) {
                const data = await resSeries.json();
                setSeriesList(data.filter(s => !s.isDeleted));
            }

            const resTrashSeries = await fetch(`${API_URL_SERIES}/trash`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (resTrashSeries.ok) setDeletedSeries(await resTrashSeries.json());

            const resTrashEp = await fetch(`${API_PODCASTS}/trash`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (resTrashEp.ok) setDeletedEpisodes(await resTrashEp.json());

        } catch (error) { console.error("Fetch Error:", error); showToast("เกิดข้อผิดพลาดในการดึงข้อมูล", "error"); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }
        const decoded = decodeJwt(token);
        if (!decoded || decoded.role !== 'admin') { window.location.href = '/'; return; }
        fetchData(token);
    }, []);

    // --- Handlers ---
    const handleRoleChange = async (userId, newRole) => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL_ADMIN}/users/${userId}/role`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role: newRole })
        });
        showToast(`เปลี่ยนสิทธิ์เป็น ${newRole} เรียบร้อย`);
        fetchData(token);
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm("ลบผู้ใช้ถาวร?")) return;
        const token = localStorage.getItem('token');
        await fetch(`${API_URL_ADMIN}/users/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        showToast("ลบผู้ใช้เรียบร้อย");
        fetchData(token);
    };

    const handleRejectApplication = async (userId) => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL_ADMIN}/users/${userId}/reject`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
        showToast("ปฏิเสธคำขอเรียบร้อย");
        fetchData(token);
    };

    const handleResolveReport = async (reportId) => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL_ADMIN}/reports/${reportId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
        showToast("แก้ไขรายงานปัญหาเรียบร้อย");
        fetchData(token);
    };

    const handleSoftDeleteSeries = async (id) => {
        if (!confirm("ย้ายลงถังขยะ?")) return;
        const token = localStorage.getItem('token');
        await fetch(`${API_URL_SERIES}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        showToast("ย้ายลงถังขยะแล้ว");
        fetchData(token);
    };

    const handleRestore = async (id, type) => {
        const token = localStorage.getItem('token');
        const url = type === 'series' ? `${API_URL_SERIES}/${id}/restore` : `${API_PODCASTS}/${id}/restore`;
        await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
        showToast("กู้คืนข้อมูลเรียบร้อย");
        fetchData(token);
    };

    const handleForceDelete = async (id, type) => {
        if (!confirm("ลบถาวร? กู้คืนไม่ได้!")) return;
        const token = localStorage.getItem('token');
        const url = type === 'series' ? `${API_URL_SERIES}/${id}/force` : `${API_PODCASTS}/${id}/force`;
        await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        showToast("ลบข้อมูลถาวรเรียบร้อย");
        fetchData(token);
    };

    const handleSendNotification = async () => {
        if (!notificationMessage.trim()) return alert("ใส่ข้อความก่อนส่ง");
        const token = localStorage.getItem('token');
        setIsSending(true);
        try {
            const res = await fetch(`${API_URL_ADMIN}/notify`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: notificationMessage })
            });
            if (res.ok) { showToast("ส่งประกาศสำเร็จ"); setNotificationMessage(''); }
        } catch (e) { showToast("ส่งไม่สำเร็จ", "error"); }
        finally { setIsSending(false); }
    };

    const handleSendTargeted = async () => {
        if (!notificationMessage.trim() || !targetUser) return;
        const token = localStorage.getItem('token');
        setIsSending(true);
        try {
            const res = await fetch(`${API_URL_ADMIN}/notify/${targetUser._id}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: notificationMessage })
            });
            if (res.ok) { showToast("ส่งข้อความสำเร็จ"); setIsModalOpen(false); setNotificationMessage(''); }
        } catch (e) { showToast("ส่งไม่สำเร็จ", "error"); }
        finally { setIsSending(false); }
    };

    // Filtered Data
    const pendingWriters = users.filter(u => u.writerApplicationStatus === 'Pending');
    const otherUsers = users.filter(u => u.writerApplicationStatus !== 'Pending' && (u.username.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase())));

    //  FIX: กรอง Series ตามคำค้นหา (Title, Author, Desc)
    const filteredSeriesList = seriesList.filter(s => {
        const query = searchContent.toLowerCase();
        return (
            s.title.toLowerCase().includes(query) ||
            (s.author?.username || '').toLowerCase().includes(query) ||
            (s.desc || '').toLowerCase().includes(query) ||
            (s.category || '').toLowerCase().includes(query)
        );
    });

    if (isLoading) return <Layout wide={true}><div className="flex h-[80vh] items-center justify-center text-gray-400 animate-pulse">Loading Dashboard...</div></Layout>;

    return (
        <Layout wide={true}>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                <aside className="lg:col-span-3 space-y-6">
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl p-6 sticky top-24">
                        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Main Menu</h2>
                        <nav className="space-y-2">
                            {[
                                { id: 'dashboard', label: 'Overview', icon: Icons.Dashboard },
                                { id: 'users', label: 'User Management', icon: Icons.Users, badge: pendingWriters.length },
                                { id: 'reports', label: 'Reports Inbox', icon: Icons.Report, badge: reports.length },
                                { id: 'content', label: 'Content Control', icon: Icons.Content },
                                { id: 'trash', label: 'trash', icon: Icons.Trash },
                                { id: 'announce', label: 'Broadcast', icon: Icons.Broadcast },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === item.id
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon />
                                        {item.label}
                                    </div>
                                    {item.badge > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                <section className="lg:col-span-9 space-y-6">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                            <StatCard title="Total Users" value={users.length} icon={Icons.Users} color="blue" />
                            <StatCard title="Pending Requests" value={pendingWriters.length} icon={Icons.Check} color="yellow" />
                            <StatCard title="Active Reports" value={reports.length} icon={Icons.Report} color="red" />
                        </div>
                    )}

                    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl p-6 min-h-[500px] animate-fade-in">

                        {activeTab === 'dashboard' && (
                            <div className="text-center py-20">
                                <h2 className="text-2xl font-bold text-white mb-2">Welcome back, Admin! </h2>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Icons.Users /> User Management
                                </h2>
                                {pendingWriters.length > 0 && (
                                    <div className="mb-8 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl">
                                        <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">⚠️ Pending Writer Applications</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="text-yellow-500/70 border-b border-yellow-700/30"><tr><th className="pb-2">User</th><th className="pb-2">Reason</th><th className="pb-2 text-right">Action</th></tr></thead>
                                                <tbody className="divide-y divide-yellow-700/30">
                                                    {pendingWriters.map(u => (
                                                        <tr key={u._id}>
                                                            <td className="py-3"><div className="font-bold text-yellow-200">{u.username}</div><div className="text-xs opacity-70">{u.email}</div></td>
                                                            <td className="py-3 italic opacity-80">"{u.writerApplicationReason}"</td>
                                                            <td className="py-3 text-right space-x-2">
                                                                <button onClick={() => handleRoleChange(u._id, 'writer')} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 transition">Approve</button>
                                                                <button onClick={() => handleRejectApplication(u._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition">Reject</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-300">All Users</h3>
                                    <input type="text" placeholder="Search users" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm w-64 focus:border-purple-500 focus:outline-none" />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-gray-400 border-b border-gray-700"><tr><th className="py-3">User</th><th className="py-3">Role</th><th className="py-3 text-right">Actions</th></tr></thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {otherUsers.map(u => (
                                                <tr key={u._id} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="py-3"><div className="font-medium text-white">{u.username}</div><div className="text-xs text-gray-500">{u.email}</div></td>
                                                    <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'writer' ? 'bg-yellow-500/20 text-yellow-400' : u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{u.role.toUpperCase()}</span></td>
                                                    <td className="py-3 text-right space-x-2">
                                                        <button onClick={() => { setTargetUser(u); setIsModalOpen(true); }} className="text-gray-500 hover:text-white p-4" title="Message"><Icons.Broadcast /></button>
                                                        {u.role !== 'admin' && (
                                                            <>
                                                                {u.role === 'user' ?
                                                                    <button onClick={() => handleRoleChange(u._id, 'writer')} className="text-yellow-500 hover:text-yellow-300 text-xl underline">writer</button> :
                                                                    <button onClick={() => handleRoleChange(u._id, 'user')} className="text-gray-500 hover:text-gray-300 text-xl underline">user</button>
                                                                }
                                                                <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-300 text-xl underline">Delete</button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}




                        {/*  UPDATED REPORTS TAB */}
                        {activeTab === 'reports' && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Icons.Report /> Reports Inbox</h2>
                                <div className="space-y-4">
                                    {reports.length === 0 ? <div className="text-center py-10 text-gray-500">No active reports. Clean! ✨</div> :
                                        reports.map(report => (
                                            <div key={report._id} className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold">{reasonTranslator[report.reason] || report.reason}</span>
                                                        <span className="text-gray-500 text-xs flex items-center gap-1">
                                                            • Reported by <span className="text-gray-300">{report.reporter?.username || 'Unknown'}</span>
                                                        </span>
                                                        {/*  Added Timestamp Here */}
                                                        <span className="text-gray-600 text-xs flex items-center gap-1">
                                                            • 🕒 {new Date(report.createdAt).toLocaleString('th-TH')}
                                                        </span>
                                                    </div>
                                                    <p className="text-white font-medium">Target:</p>
                                                    <p className="text-sm text-gray-400 mt-1">"{report.details}"</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <button onClick={() => handleResolveReport(report._id)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition shadow-lg">Mark Resolved</button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}







                        {/* TAB: CONTENT */}
                        {activeTab === 'content' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icons.Content /> Content Control</h2>
                                    {/* 💥 NEW: ช่องค้นหา Content */}
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchContent}
                                        onChange={(e) => setSearchContent(e.target.value)}
                                        className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm w-64 focus:border-purple-500 focus:outline-none placeholder-gray-500"
                                    />
                                </div>
                                <div className="space-y-3">
                                    {filteredSeriesList.map(s => (
                                        <div key={s._id} className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex justify-between items-center group hover:border-gray-500 transition-all">
                                            <div>
                                                <div className="font-bold text-white text-lg">{s.title}</div>
                                                <div className="text-xs text-gray-500">By <span className="text-yellow-500">{s.author?.username || 'Unknown'}</span> • <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">{s.category}</span></div>
                                                <div className="text-xs text-gray-600 mt-1 line-clamp-1">{s.desc}</div>
                                            </div>
                                            <button onClick={() => handleSoftDeleteSeries(s._id)} className="opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg text-sm hover:bg-red-500 hover:text-white transition-all">
                                                Delete 
                                            </button>
                                        </div>
                                    ))}
                                    {filteredSeriesList.length === 0 && <p className="text-gray-500 text-center py-10">No active content found.</p>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'trash' && (
                            <div>
                                <h2 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2"><Icons.Trash /> Recycle Bin</h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-gray-900/50 p-4 rounded-xl border border-red-900/30">
                                        <h3 className="font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Deleted Series</h3>
                                        <div className="space-y-2">
                                            {deletedSeries.map(item => (
                                                <div key={item._id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                                                    <div className="truncate w-1/2 text-sm text-gray-400 line-through">{item.title}</div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRestore(item._id, 'series')} className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded hover:bg-green-600/40">Restore</button>
                                                        <button onClick={() => handleForceDelete(item._id, 'series')} className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded hover:bg-red-600/40">Delete permanently</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-xl border border-red-900/30">
                                        <h3 className="font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Deleted Episodes</h3>
                                        <div className="space-y-2">
                                            {deletedEpisodes.map(item => (
                                                <div key={item._id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                                                    <div className="truncate w-1/2 text-sm text-gray-400 line-through">{item.title}</div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRestore(item._id, 'podcast')} className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded hover:bg-green-600/40">Restore</button>
                                                        <button onClick={() => handleForceDelete(item._id, 'podcast')} className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded hover:bg-red-600/40">Delete permanently</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'announce' && (
                            <div className="max-w-2xl mx-auto">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"><Icons.Broadcast /></div>
                                    <h2 className="text-2xl font-bold text-white">System Megaphone</h2>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl">
                                    <textarea
                                        className="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white mb-4 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        rows="4"
                                        placeholder="ประกาศให้ชาวโลกรู้"
                                        value={notificationMessage}
                                        onChange={e => setNotificationMessage(e.target.value)}
                                    />
                                    <button onClick={handleSendNotification} disabled={isSending} className="w-full bg-green-600 hover:bg-green-300 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isSending ? 'Sending...' : 'Send Broadcast Now '}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {isModalOpen && targetUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
                    <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl transform scale-100 transition-all">
                        <h3 className="text-xl font-bold mb-2 text-white">Send Message</h3>
                        <p className="text-gray-400 text-sm mb-6">To: <span className="text-purple-400 font-medium">{targetUser.username}</span></p>
                        <textarea
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white mb-6 focus:ring-2 focus:ring-blue-500 outline-none" rows="4"
                            placeholder="Type your private message..."
                            value={notificationMessage}
                            onChange={e => setNotificationMessage(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                            <button onClick={handleSendTargeted} disabled={isSending} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-all">Send</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}