import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { FaEye, FaEyeSlash, FaLock, FaUnlock, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import ScrollToTopButton from '../components/ScrollToTopButton';
import BackButton from '../components/UI/BackButton';

function ResetPassword() {
  const { currentUser, updateUserPassword } = useAuth();
  const navigate = useNavigate();

  // 表單狀態
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 密碼可見性狀態
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // 表單提交狀態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 密碼強度檢查
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // 如果用戶未登入，重定向到登入頁面
  useEffect(() => {
    if (!currentUser) {
      navigate(ROUTES.SIGN);
    }
  }, [currentUser, navigate]);

  // 處理表單輸入變化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 如果是新密碼，檢查密碼強度
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  // 切換密碼可見性
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 檢查密碼強度
  const checkPasswordStrength = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // 計算密碼強度分數 (0-5)
    let score = 0;
    if (hasMinLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;

    setPasswordStrength({
      score,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar
    });
  };

  // 獲取密碼強度顏色
  const getStrengthColor = () => {
    const { score } = passwordStrength;
    if (score <= 1) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // 獲取密碼強度文字
  const getStrengthText = () => {
    const { score } = passwordStrength;
    if (score <= 1) return '弱';
    if (score <= 3) return '中';
    return '強';
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 表單驗證
    if (!formData.currentPassword) {
      setError('請輸入當前密碼');
      return;
    }

    if (!formData.newPassword) {
      setError('請輸入新密碼');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('新密碼與確認密碼不符');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('密碼強度不足，請設置更強的密碼');
      return;
    }

    // 提交表單
    setIsSubmitting(true);
    try {
      await updateUserPassword(formData.currentPassword, formData.newPassword);
      setSuccess('密碼已成功更新！');
      // 清空表單
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      // 3秒後重定向到個人資料頁面
      setTimeout(() => {
        navigate(ROUTES.PROFILE);
      }, 3000);
    } catch (error) {
      console.error('密碼更新失敗:', error);
      if (error.code === 'auth/wrong-password') {
        setError('當前密碼不正確');
      } else {
        setError(`密碼更新失敗: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        {/* 返回按鈕 */}
        <BackButton navigate={navigate} />
        
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            重設密碼
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            請輸入您的當前密碼和新密碼
          </p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 成功訊息 */}
        {success && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded relative" role="alert">
            <div className="flex items-center">
              <FaCheck className="mr-2" />
              <span>{success}</span>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* 當前密碼 */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              當前密碼
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="currentPassword"
                name="currentPassword"
                type={passwordVisibility.currentPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 py-2 sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="請輸入當前密碼"
                value={formData.currentPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility('currentPassword')}
              >
                {passwordVisibility.currentPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* 新密碼 */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              新密碼
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUnlock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="newPassword"
                name="newPassword"
                type={passwordVisibility.newPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 py-2 sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="請輸入新密碼"
                value={formData.newPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility('newPassword')}
              >
                {passwordVisibility.newPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* 密碼強度指示器 */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">密碼強度：{getStrengthText()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className={`h-2.5 rounded-full ${getStrengthColor()}`} 
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>

                {/* 密碼要求列表 */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-xs">
                    {passwordStrength.hasMinLength ? (
                      <FaCheck className="text-green-500 mr-1" />
                    ) : (
                      <FaTimes className="text-red-500 mr-1" />
                    )}
                    <span className={passwordStrength.hasMinLength ? "text-green-500" : "text-red-500"}>
                      至少 8 個字符
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    {passwordStrength.hasUpperCase ? (
                      <FaCheck className="text-green-500 mr-1" />
                    ) : (
                      <FaTimes className="text-red-500 mr-1" />
                    )}
                    <span className={passwordStrength.hasUpperCase ? "text-green-500" : "text-red-500"}>
                      至少一個大寫字母
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    {passwordStrength.hasLowerCase ? (
                      <FaCheck className="text-green-500 mr-1" />
                    ) : (
                      <FaTimes className="text-red-500 mr-1" />
                    )}
                    <span className={passwordStrength.hasLowerCase ? "text-green-500" : "text-red-500"}>
                      至少一個小寫字母
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    {passwordStrength.hasNumber ? (
                      <FaCheck className="text-green-500 mr-1" />
                    ) : (
                      <FaTimes className="text-red-500 mr-1" />
                    )}
                    <span className={passwordStrength.hasNumber ? "text-green-500" : "text-red-500"}>
                      至少一個數字
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    {passwordStrength.hasSpecialChar ? (
                      <FaCheck className="text-green-500 mr-1" />
                    ) : (
                      <FaTimes className="text-red-500 mr-1" />
                    )}
                    <span className={passwordStrength.hasSpecialChar ? "text-green-500" : "text-red-500"}>
                      至少一個特殊字符 (!@#$%^&*(),.?":{}|&lt;&gt;)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 確認新密碼 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              確認新密碼
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUnlock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={passwordVisibility.confirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 py-2 sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="請再次輸入新密碼"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                {passwordVisibility.confirmPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {/* 密碼匹配指示器 */}
            {formData.confirmPassword && (
              <div className="mt-1 flex items-center text-xs">
                {formData.newPassword === formData.confirmPassword ? (
                  <>
                    <FaCheck className="text-green-500 mr-1" />
                    <span className="text-green-500">密碼匹配</span>
                  </>
                ) : (
                  <>
                    <FaTimes className="text-red-500 mr-1" />
                    <span className="text-red-500">密碼不匹配</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isSubmitting ? '處理中...' : '更新密碼'}
            </button>
          </div>

        </form>
      </div>
      {/* 添加回到頂部按鈕 */}
      <ScrollToTopButton />
    </div>
  );
}

export default ResetPassword;
