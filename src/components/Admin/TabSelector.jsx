import React from 'react';

// TabSelector 組件：用於管理員面板的標籤選擇器，讓管理員可以在「用戶管理」和「文章管理」之間切換
function TabSelector({ activeTab, handleTabChange }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      <button
        className={`py-2 px-4 font-medium ${
          activeTab === 'users'
            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' // 當前激活標籤的樣式
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300' // 未激活標籤的樣式
        }`}
        onClick={() => handleTabChange('users')} // 點擊時切換到「用戶管理」標籤
      >
        用戶管理
      </button>
      <button
        className={`py-2 px-4 font-medium ${
          activeTab === 'posts'
            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' // 當前激活標籤的樣式
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300' // 未激活標籤的樣式
        }`}
        onClick={() => handleTabChange('posts')} // 點擊時切換到「文章管理」標籤
      >
        文章管理
      </button>
    </div>
  );
}

export default TabSelector;
