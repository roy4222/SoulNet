// 引入必要的 React 和 Framer Motion 庫
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定義 SuccessToast 組件，接受 show 和 message 作為 props
function SuccessToast({ show, message = '訊息傳送成功！' }) {
  return (
    // 使用 AnimatePresence 來處理組件的進場和出場動畫
    <AnimatePresence>
      {/* 只有當 show 為 true 時才渲染 Toast */}
      {show && (
        // 使用 motion.div 來添加動畫效果
        <motion.div
          // 定義初始狀態：完全透明且在頂部上方 50px
          initial={{ opacity: 0, y: -50 }}
          // 定義動畫狀態：完全不透明且回到原位
          animate={{ opacity: 1, y: 0 }}
          // 定義退出狀態：與初始狀態相同
          exit={{ opacity: 0, y: -50 }}
          // 設置 Toast 的樣式和位置
          className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
        >
          {/* 顯示傳入的消息或默認消息 */}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 導出 SuccessToast 組件
export default SuccessToast;