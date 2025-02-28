// 引入必要的依賴
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '../routes';
import { useAuth } from '../contexts/AuthContext';

// 預設頭像URL
const DEFAULT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCvBNjFR_6BVhW3lFNwF0oEk2N8JXjeiaSqg&s';

// MobileMenu 組件
export default function MobileMenu({ 
    isOpen,  // 控制選單是否開啟
    onClose,  // 關閉選單的函數
    user,  // 用戶資訊
    navLinks,  // 導航連結
    handleSignOut,  // 處理登出的函數
    isDarkMode,  // 當前是否為深色模式
    toggleTheme,  // 切換主題的函數
    menuRef  // 選單的 ref
}) {
    const navigate = useNavigate();
    const { isAdmin } = useAuth(); // 獲取用戶角色信息

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 背景遮罩：點擊時關閉選單 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black lg:hidden"
                        onClick={onClose}
                    />
                    {/* 側邊選單內容 */}
                    <motion.div
                        ref={menuRef}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween' }}
                        className="fixed top-0 right-0 w-80 h-full bg-white dark:bg-gray-900 shadow-xl lg:hidden overflow-y-auto"
                    >
                        {/* 選單頂部：標題和關閉按鈕 */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">選單</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                                aria-label="關閉選單"
                            >
                                <svg
                                    className="w-6 h-6 text-gray-600 dark:text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* 選單內容 */}
                        <div className="p-4">
                            {/* 用戶資訊區塊：顯示頭像、名稱和郵箱 */}
                            {user ? (
                                <>
                                    <div className="mb-6">
                                        <button
                                            onClick={() => {
                                                navigate('/profile');
                                                onClose();  // 關閉選單的函數
                                            }}
                                            className="w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                            aria-label="查看個人資料"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <img 
                                                    src={user.photoURL || DEFAULT_AVATAR} 
                                                    alt={user.displayName || '使用者'}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                        {user.displayName || '使用者'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* 發表文章按鈕 */}
                                    <Link 
                                        to={ROUTES.NEW_POST}
                                        onClick={onClose}
                                        className="mb-4 w-full bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition duration-300 shadow-md flex items-center justify-center space-x-2"
                                    >
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
                                        <span>發表文章</span>
                                    </Link>
                                </>
                            ) : (
                                // 未登入時顯示登入和註冊按鈕
                                <div className="mb-6 space-y-2">
                                    <Link
                                        to="/sign"
                                        className="block w-full text-center bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition duration-300 shadow-md"
                                        onClick={onClose}
                                    >
                                        登入
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="block w-full text-center bg-pink-500 dark:bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-600 dark:hover:bg-pink-700 transition duration-300 shadow-md"
                                        onClick={onClose}
                                    >
                                        註冊
                                    </Link>
                                </div>
                            )}

                            {/* 導航連結：遍歷並顯示所有導航項目 */}
                            <div className="space-y-2">
                                {navLinks.map(link => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors duration-200"
                                        onClick={onClose}
                                    >
                                        {link.text}
                                    </Link>
                                ))}
                                
                                {/* 管理員面板連結 - 只對管理員顯示 */}
                                {user && isAdmin() && (
                                    <Link
                                        to={ROUTES.ADMIN}
                                        className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors duration-200"
                                        onClick={onClose}
                                    >
                                        管理員面板
                                    </Link>
                                )}
                            </div>

                            {/* 主題切換按鈕：根據當前模式顯示不同圖標和文字 */}
                            <button
                                onClick={() => {
                                    toggleTheme();
                                    onClose();
                                }}
                                className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                            >
                                {isDarkMode ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-500">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                        </svg>
                                        <span>切換至淺色模式</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                        </svg>
                                        <span>切換至深色模式</span>
                                    </>
                                )}
                            </button>

                            {/* 底部選項：僅在用戶登入時顯示登出按鈕 */}
                            {user && (
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                    <button
                                        onClick={() => {
                                            handleSignOut();
                                            onClose();
                                        }}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>登出</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
