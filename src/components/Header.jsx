// Header 組件：網站的頂部導航欄
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import firebase from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';

// 預設頭像URL
const DEFAULT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCvBNjFR_6BVhW3lFNwF0oEk2N8JXjeiaSqg&s';

export default function Header() {
    // 定義狀態變量和鉤子
    const [user, setUser] = useState(null);  // 用戶狀態
    const [showNotification, setShowNotification] = useState(false);  // 通知顯示狀態
    const [notificationMessage, setNotificationMessage] = useState('');  // 通知消息
    const [showDropdown, setShowDropdown] = useState(false);  // 下拉菜單顯示狀態
    const [isMenuOpen, setIsMenuOpen] = useState(false);  // 漢堡選單狀態
    const navigate = useNavigate();  // 用於頁面導航
    const auth = getAuth(firebase);  // 獲取 Firebase 認證實例
    const dropdownRef = useRef(null);  // 下拉菜單的引用
    const menuRef = useRef(null);  // 漢堡選單的引用

    useEffect(() => {
        // 監聽用戶登入狀態
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);  // 更新用戶狀態
        });

        // 點擊外部關閉下拉選單和漢堡選單
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);  // 關閉下拉菜單
            }
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);  // 關閉漢堡選單
            }
        };

        // 添加點擊事件監聽器
        document.addEventListener('mousedown', handleClickOutside);

        // 清理函數：取消訂閱和移除事件監聽器
        return () => {
            unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [auth]);

    // 處理登出
    const handleSignOut = async () => {
        try {
            await signOut(auth);  // 執行登出
            setNotificationMessage('登出成功！');  // 設置成功消息
            setShowNotification(true);  // 顯示通知
            setTimeout(() => setShowNotification(false), 3000);  // 3秒後隱藏通知
            navigate('/sign');  // 導航到登入頁
        } catch (error) {
            console.error('登出錯誤:', error);  // 記錄錯誤
        }
    };

    // 導航連結列表
    const navLinks = [
        { to: ROUTES.HOME, text: '首頁' },
        { to: '/explore', text: '探索' },
        { to: '/messages', text: '訊息' }
    ];

    return (
        // 導航欄容器，使用白色背景和陰影效果，固定在頂部
        <nav className="fixed top-0 left-0 right-0 bg-white z-50 shadow-md">
            {/* 內容限制寬度並置中 */}
            <div className="max-w-6xl mx-auto px-4">
                {/* Flex 容器，用於排列導航欄內的元素 */}
                <div className="flex justify-between items-center py-4">
                    {/* 左側 Logo 和網站名稱 */}
                    <div className="flex items-center">
                        <Link to={ROUTES.HOME} className="flex items-center">
                            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRu6w1L1n_jpEO94b80gNhWHTvkpCtCHvui2Q&s" alt="Logo" className="h-8 w-auto mr-4" />
                            <span className="font-semibold text-xl text-gray-800">Social Platform</span>
                        </Link>
                    </div>

                    {/* 導航連結 - 只在大螢幕顯示 */}
                    <div className="px-4 hidden lg:flex items-center space-x-6">
                        {navLinks.map(link => (
                            <Link 
                                key={link.to} 
                                to={link.to} 
                                className="text-gray-600 hover:text-gray-900"
                            >
                                {link.text}
                            </Link>
                        ))}
                    </div>

                    {/* 中間搜索欄 - 只在大螢幕顯示 */}
                    <div className="hidden lg:flex flex-1 mx-8">
                        <div className="relative w-full">
                            <input 
                                type="text" 
                                className="w-full border rounded-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500" 
                                placeholder="搜尋..." 
                            />
                            <button className="absolute right-0 top-0 mt-2 mr-4">
                                <svg 
                                    className="h-5 w-5 text-gray-400" 
                                    fill="none" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* 右側用戶區域 - 只在大螢幕顯示 */}
                    <div className="hidden lg:flex items-center space-x-4">
                        {user ? (
                            // 如果用戶已登入，顯示發表文章按鈕和用戶頭像
                            <>
                                {/* 發表文章按鈕 */}
                                <Link 
                                    to="/Posts"
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300 flex items-center space-x-2"
                                >
                                    {/* 加號圖標 */}
                                    <svg 
                                        className="w-5 h-5" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth="2" 
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                    {/* 按鈕文字 */}
                                    <span>發表文章</span>
                                </Link>
                                <div className="relative" ref={dropdownRef}>
                                    {/* 用戶頭像按鈕，點擊時切換下拉選單的顯示狀態 */}
                                    <button 
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="focus:outline-none"
                                    >
                                        <img 
                                            src={user.photoURL || DEFAULT_AVATAR}
                                            alt="用戶頭像" 
                                            className="w-10 h-10 rounded-full border-2 border-blue-500 hover:border-blue-600 transition-colors duration-200"
                                        />
                                    </button>

                                    {/* 使用 AnimatePresence 來處理下拉選單的動畫 */}
                                    <AnimatePresence>
                                        {showDropdown && (
                                            // 下拉選單內容
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute right-0 mt-2 w-50 bg-white rounded-lg shadow-xl py-2 z-50"
                                            >
                                                {/* 用戶資訊區塊 */}
                                                <div className="px-4 py-2 border-b border-gray-100 ">
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        {user.displayName || '使用者'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                {/* 個人資料連結 */}
                                                <Link 
                                                    to="/profile" 
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    個人資料
                                                </Link>
                                                {/* 登出按鈕 */}
                                                <button 
                                                    onClick={() => {
                                                        handleSignOut();
                                                        setShowDropdown(false);
                                                    }}
                                                    className="block w-full text-left text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors duration-200"
                                                >
                                                    登出
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            // 如果用戶未登入，顯示登入和註冊按鈕
                            <div className="flex space-x-4">
                                <Link 
                                    to="/sign" 
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md"
                                >
                                    登入
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition duration-300 shadow-md"
                                >
                                    註冊
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 漢堡選單按鈕 - 只在手機版顯示 */}
                    <button 
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="打開選單"
                    >
                        <svg 
                            className="w-6 h-6 text-gray-600" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 漢堡選單側邊欄 */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* 背景遮罩 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black lg:hidden"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        {/* 側邊欄 */}
                        <motion.div
                            ref={menuRef}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed top-0 right-0 h-full w-68 bg-white shadow-xl lg:hidden z-50"
                        >
                            {/* 側邊欄內容 */}
                            <div className="flex flex-col h-full">
                                <div className="p-4">
                                    {/* 用戶資訊區域 */}
                                    {user ? (
                                        <div>
                                            {/* 用戶頭像和個人信息 */}
                                            <div className="mb-6">
                                                <div className="flex items-center space-x-3 mb-4">
                                                    {/* 用戶頭像 */}
                                                    <img 
                                                        src={user.photoURL || DEFAULT_AVATAR}
                                                        alt="用戶頭像" 
                                                        className="w-12 h-12 rounded-full border-2 border-blue-500"
                                                    />
                                                    {/* 用戶名稱和郵箱 */}
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            {user.displayName || '使用者'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* 發表文章按鈕 */}
                                            <Link 
                                                to="/create-post"
                                                className="block w-full mb-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <div className="flex items-center justify-center space-x-2">
                                                    {/* 加號圖標 */}
                                                    <svg 
                                                        className="w-5 h-5" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path 
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round" 
                                                            strokeWidth="2" 
                                                            d="M12 4v16m8-8H4"
                                                        />
                                                    </svg>
                                                    {/* 按鈕文字 */}
                                                    <span>發表文章</span>
                                                </div>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="mb-6 space-y-2">
                                            <Link 
                                                to="/sign" 
                                                className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                登入
                                            </Link>
                                            <Link 
                                                to="/register" 
                                                className="block w-full text-center bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition duration-300 shadow-md"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                註冊
                                            </Link>
                                        </div>
                                    )}

                                    {/* 搜索欄 */}
                                    <div className="mb-6">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                className="w-full border rounded-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500" 
                                                placeholder="搜尋..." 
                                            />
                                            <button className="absolute right-0 top-0 mt-2 mr-4">
                                                <svg 
                                                    className="h-5 w-5 text-gray-400" 
                                                    fill="none" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth="2" 
                                                    viewBox="0 0 24 24" 
                                                    stroke="currentColor"
                                                >
                                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 導航連結 */}
                                    <div className="space-y-2">
                                        {navLinks.map(link => (
                                            <Link 
                                                key={link.to} 
                                                to={link.to} 
                                                className="block text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors duration-200"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                {link.text}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* 底部選項 */}
                                {user && (
                                    <div className="mt-auto p-4 border-t border-gray-200">
                                        <Link 
                                            to="/profile" 
                                            className="block text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors duration-200 mb-2"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            個人資料
                                        </Link>
                                        <button 
                                            onClick={() => {
                                                handleSignOut();
                                                setIsMenuOpen(false);
                                            }}
                                            className="block w-full text-left text-red-600 hover:text-red-700 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors duration-200"
                                        >
                                            登出
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* 通知提示：當 showNotification 為 true 時顯示 */}
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        // 初始狀態：完全透明且向上偏移 50px
                        initial={{ opacity: 0, y: -50 }}
                        // 動畫結束狀態：完全不透明且回到原位
                        animate={{ opacity: 1, y: 0 }}
                        // 退場動畫：恢復到初始狀態
                        exit={{ opacity: 0, y: -50 }}
                        // 固定位置、顏色、內邊距、圓角和陰影樣式
                        className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg"
                    >
                        {/* 顯示通知訊息 */}
                        {notificationMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}