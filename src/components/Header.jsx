// Header 組件：網站的頂部導航欄
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/themeContext';
import MobileMenu from './MobileMenu';
import { useAuth } from '../contexts/AuthContext';

// 預設頭像URL
const DEFAULT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCvBNjFR_6BVhW3lFNwF0oEk2N8JXjeiaSqg&s';

// localStorage 的 key
const USER_KEY = 'social:user';

export default function Header() {
    // 定義狀態變量和鉤子
    const [user, setUser] = useState(() => {
        // 初始化時從 localStorage 讀取用戶資訊
        const savedUser = localStorage.getItem(USER_KEY);
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [showNotification, setShowNotification] = useState(false); // 控制通知顯示狀態
    const [notificationMessage, setNotificationMessage] = useState(''); // 存儲通知消息
    const [showDropdown, setShowDropdown] = useState(false); // 控制下拉菜單顯示狀態
    const [isMenuOpen, setIsMenuOpen] = useState(false); // 控制漢堡菜單顯示狀態
    const navigate = useNavigate(); // 用於頁面導航的鉤子
    const dropdownRef = useRef(null); // 下拉菜單的引用，用於檢測外部點擊
    const menuRef = useRef(null); // 漢堡菜單的引用，用於檢測外部點擊
    const { isDarkMode, toggleTheme } = useTheme();
    const { isAdmin } = useAuth(); // 獲取用戶角色信息

    // 顯示通知的函數
    const displayNotification = (message) => {
        setNotificationMessage(message); // 設置通知消息
        setShowNotification(true); // 顯示通知
        // 1秒後自動關閉通知
        setTimeout(() => {
            setShowNotification(false);
        }, 1000);
    };

    useEffect(() => {
        // 監聽用戶登入狀態
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // 用戶登入時，將資訊存入 localStorage
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL || DEFAULT_AVATAR // 如果沒有頭像，使用默認頭像
                };
                localStorage.setItem(USER_KEY, JSON.stringify(userData));
                setUser(userData); // 更新用戶狀態
            } else {
                // 用戶登出時，清除 localStorage
                localStorage.removeItem(USER_KEY);
                setUser(null); // 清除用戶狀態
            }
        });

        // 監聽自定義的 auth 狀態變化事件
        const handleAuthChange = (event) => {
            const user = event.detail.user;
            if (user) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL || DEFAULT_AVATAR
                };
                localStorage.setItem(USER_KEY, JSON.stringify(userData));
                setUser(userData);
            }
        };
        window.addEventListener('auth-state-changed', handleAuthChange);

        // 點擊外部關閉下拉選單和漢堡選單
        const handleClickOutside = (event) => {
            // 如果點擊的不是下拉菜單內部，則關閉下拉菜單
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            // 如果點擊的不是漢堡菜單內部，則關閉漢堡菜單
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        // 添加點擊事件監聽器
        document.addEventListener('mousedown', handleClickOutside);

        // 清理函數
        return () => {
            unsubscribe(); // 取消 Firebase 身份驗證監聽器
            window.removeEventListener('auth-state-changed', handleAuthChange);
            document.removeEventListener('mousedown', handleClickOutside); // 移除點擊事件監聽器
        };
    }, []); // 空依賴數組表示這個效果只在組件掛載和卸載時運行

    // 處理登出
    const handleSignOut = async () => {
        try {
            await signOut(auth); // 調用 Firebase 的登出方法
            localStorage.removeItem(USER_KEY); // 清除本地存儲的用戶信息
            setUser(null); // 清除用戶狀態
            displayNotification('登出成功！'); // 顯示成功通知
            navigate('/sign'); // 導向到登入頁面
        } catch (error) {
            console.error('登出錯誤:', error);
            displayNotification('登出失敗，請稍後再試'); // 顯示錯誤通知
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
        <nav className={`fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 z-50 shadow-md`}>
            {/* 內容限制寬度並置中 */}
            <div className="max-w-6xl mx-auto px-4">
                {/* Flex 容器，用於排列導航欄內的元素 */}
                <div className="flex justify-between items-center py-4">
                    {/* 左側 Logo 和網站名稱 */}
                    <div className="flex items-center">
                        <Link to={ROUTES.HOME} className="flex items-center">
                            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRu6w1L1n_jpEO94b80gNhWHTvkpCtCHvui2Q&s" alt="Logo" className="h-8 w-auto mr-4" />
                            <span className="font-semibold text-xl text-gray-800 dark:text-gray-200">SoulNet</span>
                        </Link>
                    </div>

                    {/* 導航連結 - 只在大螢幕顯示 */}
                    <div className="px-4 hidden lg:flex items-center space-x-6">
                        {navLinks.map(link => (
                            <Link 
                                key={link.to} 
                                to={link.to} 
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
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
                                className="w-full border rounded-full py-2 px-4 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:border-blue-500 dark:focus:border-blue-400" 
                                placeholder="搜尋..." 
                            />
                            <button className="absolute right-0 top-0 mt-2 mr-4">
                                <svg 
                                    className="h-5 w-5 text-gray-400 dark:text-gray-500" 
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
                                    to={ROUTES.NEW_POST}
                                    className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition duration-300 shadow-md flex items-center space-x-2"
                                >
                                    {/* 加號圖標 */}
                                    <svg 
                                        className="w-5 h-5 flex-shrink-0" 
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
                                    <span className="whitespace-nowrap">發表文章</span>
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
                                            className="w-10 h-10 rounded-full border-2 border-blue-500 dark:border-blue-600 hover:border-blue-600 dark:hover:border-blue-700 transition-colors duration-200 object-cover"
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
                                                className="absolute right-0 mt-2 w-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50"
                                            >
                                                {/* 用戶資訊區塊 */}
                                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 ">
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                        {user.displayName || '使用者'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                {/* 個人資料連結 */}
                                                <Link 
                                                    to={ROUTES.PROFILE}
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    個人資料
                                                </Link>  
                                                {/* 管理員面板連結 - 只對管理員顯示 */}
                                                {isAdmin() && (
                                                    <Link 
                                                        to={ROUTES.ADMIN}
                                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                                        onClick={() => setShowDropdown(false)}
                                                    >
                                                        管理員面板
                                                    </Link>
                                                )}
                                                {/* 登出按鈕 */}
                                                <button 
                                                    onClick={() => {
                                                        handleSignOut();
                                                        setShowDropdown(false);
                                                    }}
                                                    className="block w-full text-left text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"
                                                >
                                                    登出
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {/* 主題切換按鈕 */}
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                                    aria-label="切換暗黑模式"
                                >
                                    {isDarkMode ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-500">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                        </svg>
                                    )}
                                </button>
                            </>
                        ) : (
                            // 如果用戶未登入，顯示登入和註冊按鈕
                            <div className="flex space-x-4">
                                <Link 
                                    to="/sign" 
                                    className="bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition duration-300 shadow-md"
                                >
                                    登入
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="bg-pink-500 dark:bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-600 dark:hover:bg-pink-700 transition duration-300 shadow-md"
                                >
                                    註冊
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 手機版選單按鈕 */}
                    <div className="lg:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                            aria-label="開啟選單"
                        >
                            <svg
                                className="w-6 h-6 text-gray-600 dark:text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* 手機版選單 */}
            <MobileMenu 
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                user={user}
                navLinks={navLinks}
                handleSignOut={handleSignOut}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                menuRef={menuRef}
            />

            {/* 通知提示 */}
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
                    >
                        {notificationMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}