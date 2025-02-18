// 引入必要的 React 函式和組件
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import firebase from '../utils/firebase';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// 定義 Register 組件：用於處理用戶註冊的主要組件
const Register = () => {
  // 使用 useState 鉤子來管理表單輸入的狀態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // 處理表單提交的函數
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 驗證密碼
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }

    // 驗證密碼長度
    if (password.length < 6) {
      setError('密碼長度必須至少6個字符');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const auth = getAuth(firebase);
      // 創建用戶
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // 更新用戶資料
      await updateProfile(user, {
        displayName: username,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${username}` // 使用用戶名生成頭像
      });

      // 顯示成功提示
      setShowSuccess(true);
      // 3秒後導航到首頁
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      // 處理不同類型的錯誤
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('此電子郵件已被註冊');
          break;
        case 'auth/invalid-email':
          setError('無效的電子郵件地址');
          break;
        case 'auth/operation-not-allowed':
          setError('此註冊方式目前不可用');
          break;
        case 'auth/weak-password':
          setError('密碼強度太弱');
          break;
        default:
          setError('註冊失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // 主容器：使用 Flexbox 居中內容，設置最小高度和背景漸變
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 使用 Framer Motion 創建動畫效果的註冊卡片 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} // 初始狀態：透明度為 0，向下偏移 20px
        animate={{ opacity: 1, y: 0 }} // 動畫結束狀態：完全不透明，回到原位
        transition={{ duration: 0.5 }} // 動畫持續時間為 0.5 秒
        className="px-16 py-10 text-left bg-white shadow-2xl rounded-2xl w-[32rem] relative overflow-hidden"
      >
        {/* 頂部的裝飾條：添加視覺吸引力和設計感 */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
        
        {/* 標題：使用 Framer Motion 添加淡入效果 */}
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }} // 延遲 0.2 秒後開始動畫，創造階段性動畫效果
          className="text-4xl font-bold text-center mb-8 text-gray-800"
        >
          註冊新帳戶
        </motion.h3>

        {/* 註冊表單：處理用戶輸入和提交 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 使用者名稱輸入區域 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-lg font-medium text-gray-700 mb-2">
              使用者名稱
            </label>
            <input
              type="text"
              placeholder="請輸入您的使用者名稱"
              className="w-full px-5 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </motion.div>

          {/* 電子郵件輸入區域 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-lg font-medium text-gray-700 mb-2">
              電子郵件
            </label>
            <input
              type="email"
              placeholder="請輸入您的電子郵件"
              className="w-full px-5 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </motion.div>

          {/* 密碼輸入區域 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-lg font-medium text-gray-700 mb-2">
              密碼
            </label>
            <input
              type="password"
              placeholder="請輸入您的密碼"
              className="w-full px-5 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </motion.div>

          {/* 確認密碼輸入區域 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-lg font-medium text-gray-700 mb-2">
              確認密碼
            </label>
            <input
              type="password"
              placeholder="請再次輸入密碼"
              className="w-full px-5 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </motion.div>

          {/* 註冊按鈕和登入連結 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-center space-y-4 pt-4"
          >
            <button 
              className="w-full px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition duration-200"
              disabled={loading}
            >
              {loading ? '註冊中...' : '註冊'}
            </button>
            {error && <p className="text-red-600">{error}</p>}
            <Link 
              to="/sign" 
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition duration-200"
            >
              已有帳戶？登入
            </Link>
          </motion.div>
        </form>
      </motion.div>
      {/* 成功提示 */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            註冊成功！
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 導出 Register 組件，使其可以在其他文件中被引入使用
export default Register;