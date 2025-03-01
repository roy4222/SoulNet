// 導入 React 庫
import React from 'react';

// SearchBar 組件：用於顯示搜索欄
// 接收 searchQuery（搜索查詢）、setSearchQuery（設置搜索查詢的函數）和 placeholder（佔位文字）作為 props
function SearchBar({ searchQuery, setSearchQuery, placeholder }) {
  return (
    // 搜索欄容器
    <div className="relative w-64">
      {/* 搜索圖標 */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      {/* 搜索輸入框 */}
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2 pl-10 pr-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
      />
      {/* 清除搜索內容的按鈕，僅在有搜索內容時顯示 */}
      {searchQuery && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setSearchQuery('')}>
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
      )}
    </div>
  );
}

// 導出 SearchBar 組件
export default SearchBar;
