import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function ScrollToTopButton({ onClick }) {
  // 顯示/隱藏按鈕的狀態
  const [isVisible, setIsVisible] = useState(false);

  // 默認的回到頂部函數
  const defaultScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 處理點擊事件
  const handleClick = () => {
    // 如果提供了自定義的 onClick 函數，則使用它，否則使用默認函數
    if (onClick) {
      onClick();
    } else {
      defaultScrollToTop();
    }
  };

  // 監聽滾動事件，決定按鈕是否顯示
  useEffect(() => {
    const toggleVisibility = () => {
      // 當頁面滾動超過 300px 時顯示按鈕
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // 添加滾動事件監聽器
    window.addEventListener('scroll', toggleVisibility);

    // 組件卸載時移除事件監聽器
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed bottom-6 right-6 z-50"
      style={{ display: isVisible ? 'block' : 'none' }}
    >
      <button
        onClick={handleClick}
        className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200 rounded-full p-3 shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 dark:focus:ring-blue-700"
        aria-label="回到頂部"
      >
        <svg 
          className="w-6 h-6 transform transition-transform duration-300 ease-in-out hover:translate-y-[-2px]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 10l7-7m0 0l7 7m-7-7v18" 
          />
        </svg>
      </button>
    </motion.div>
  );
}

export default ScrollToTopButton;