// 引入必要的 React 和 framer-motion 庫
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// SuccessMessage 組件：顯示成功提示訊息
function SuccessMessage({ show, message = '訊息傳送成功！', actionText, onAction }) {
  return (
    // AnimatePresence 允許組件在退出 DOM 時進行動畫
    <AnimatePresence>
      {show && (
        // motion.div 用於創建可動畫化的 div 元素
        <motion.div
          // 定義初始狀態：透明度為 0，向上偏移 50 像素
          initial={{ opacity: 0, y: -50 }}
          // 定義動畫狀態：完全不透明，回到原位
          animate={{ opacity: 1, y: 0 }}
          // 定義退出狀態：透明度為 0，向上偏移 50 像素
          exit={{ opacity: 0, y: -50 }}
          // 設置樣式：固定位置、綠色背景、白色文字等
          className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex flex-col items-start"
        >
          {/* 顯示傳入的訊息 */}
          <div>{message}</div>
          {/* 如果提供了 actionText 和 onAction，則顯示一個按鈕 */}
          {actionText && onAction && (
            <button 
              onClick={onAction}
              className="mt-2 bg-white text-green-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-50 transition-colors"
            >
              {actionText}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 導出 SuccessMessage 組件
export default SuccessMessage;
