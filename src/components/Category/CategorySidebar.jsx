import React from 'react';
import { motion } from 'framer-motion';

function CategorySidebar({ 
  categories, 
  isLoading, 
  selectedCategory, 
  onCategorySelect,
  onScrollToTop 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 order-2 lg:order-1 lg:sticky lg:top-[8rem] lg:w-[240px] lg:max-h-[calc(80vh-5rem)] lg:overflow-y-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
      }}
    >
      <h2 className="text-lg font-semibold mb-4 px-2 lg:block hidden text-gray-900 dark:text-white sticky top-0 bg-white dark:bg-gray-800 z-10 py-2">
        文章分類
      </h2>
      
      {/* 分類導航 - 在手機版時水平滾動，在桌面版時垂直排列 */}
      <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 lg:mx-0 px-4 lg:px-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {isLoading ? (
          // 加載中顯示旋轉動畫
          <div className="flex justify-center">
            <svg className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S16.627 6 12 6z"></path>
            </svg>
          </div>
        ) : (
          categories.map(category => (
            <button
              key={category.id}
              onClick={() => {
                onCategorySelect(category.id);
                onScrollToTop();
              }}
              className={`px-4 py-2 rounded-lg text-left transition-all whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))
        )}
      </nav>
    </motion.div>
  );
}

export default CategorySidebar; 