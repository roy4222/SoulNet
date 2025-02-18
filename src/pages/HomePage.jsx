import React from 'react';
import { motion } from 'framer-motion';

// 定義HomePage組件
const HomePage = () => {
  return (
    // 外層容器，設置最小高度為螢幕高度，背景色為淺灰
    <div className="min-h-screen bg-gray-50">
      {/* 主要內容區域 */}
      <motion.div 
        // 初始狀態：完全透明
        initial={{ opacity: 0 }}
        // 動畫結束狀態：完全不透明
        animate={{ opacity: 1 }}
        // 動畫持續時間：0.5秒
        transition={{ duration: 0.5 }}
        // 設置最大寬度、水平居中、內邊距
        className="max-w-6xl mx-auto px-4 py-8"
      >
        {/* 歡迎區塊 */}
        <motion.div
          // 初始狀態：向下偏移20px且完全透明
          initial={{ y: 20, opacity: 0 }}
          // 動畫結束狀態：回到原位且完全不透明
          animate={{ y: 0, opacity: 1 }}
          // 動畫延遲0.2秒後開始
          transition={{ delay: 0.2 }}
          // 文字居中，下外邊距
          className="text-center mb-12"
        >
          {/* 主標題 */}
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            歡迎來到社交平台
          </h1>
          {/* 副標題 */}
          <p className="text-xl text-gray-600">
            連結朋友，分享生活，探索世界
          </p>
        </motion.div>

        {/* 功能區塊：三列布局 */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {/* 分享動態功能卡片 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            {/* 圖標 */}
            <div className="text-blue-500 text-4xl mb-4">
              <i className="fas fa-share-alt"></i>
            </div>
            {/* 標題 */}
            <h3 className="text-xl font-semibold mb-2">分享動態</h3>
            {/* 描述 */}
            <p className="text-gray-600">
              分享您的生活點滴，讓朋友們了解您的近況
            </p>
          </motion.div>

          {/* 探索內容功能卡片 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            {/* 圖標 */}
            <div className="text-blue-500 text-4xl mb-4">
              <i className="fas fa-compass"></i>
            </div>
            {/* 標題 */}
            <h3 className="text-xl font-semibold mb-2">探索內容</h3>
            {/* 描述 */}
            <p className="text-gray-600">
              發現有趣的內容，認識志同道合的朋友
            </p>
          </motion.div>

          {/* 即時互動功能卡片 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            {/* 圖標 */}
            <div className="text-blue-500 text-4xl mb-4">
              <i className="fas fa-comments"></i>
            </div>
            {/* 標題 */}
            <h3 className="text-xl font-semibold mb-2">即時互動</h3>
            {/* 描述 */}
            <p className="text-gray-600">
              與朋友即時交流，分享精彩時刻
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// 導出HomePage組件
export default HomePage;