import React from 'react';

function TabSelector({ activeTab, handleTabChange }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      <button
        className={`py-2 px-4 font-medium ${
          activeTab === 'users'
            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        onClick={() => handleTabChange('users')}
      >
        用戶管理
      </button>
      <button
        className={`py-2 px-4 font-medium ${
          activeTab === 'posts'
            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        onClick={() => handleTabChange('posts')}
      >
        文章管理
      </button>
    </div>
  );
}

export default TabSelector;
