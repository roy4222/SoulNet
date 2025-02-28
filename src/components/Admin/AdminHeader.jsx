import React from 'react';
import SearchBar from './SearchBar';
import BackButton from '../../components/UI/BackButton';

function AdminHeader({ navigate, searchQuery, setSearchQuery, activeTab }) {
  return (
    <>
      {/* 返回按鈕 */}
      <BackButton navigate={navigate} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">管理員面板</h1>
        
        {/* 搜尋欄 */}
        <SearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          placeholder={activeTab === 'users' ? '搜尋用戶名稱、郵箱或角色...' : '搜尋文章標題、作者或內容...'}
        />
      </div>
    </>
  );
}

export default AdminHeader;
