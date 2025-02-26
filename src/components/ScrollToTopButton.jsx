import React from 'react';
import { motion } from 'framer-motion';

function ScrollToTopButton() {
  // 回到頂部函數
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <motion.div
      // 初始狀態：完全透明
      initial={{ opacity: 0 }}
      // 動畫狀態：完全不透明
      animate={{ opacity: 1 }}
      // 動畫持續時間：0.3秒
      transition={{ duration: 0.3 }}
      // 固定在右下角，確保在其他元素之上
      className="fixed bottom-6 right-6"
    >
      <button
        onClick={scrollToTop}
        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        {/* 向上箭頭SVG圖標 */}
        <svg 
          className="w-6 h-6" 
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