// 引入 React 庫
import React from 'react';

// UserManagement 組件：用於管理用戶列表和角色
function UserManagement({ filteredUsers, currentUser, handleUpdateUserRole }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* 如果沒有找到用戶，顯示提示信息 */}
      {filteredUsers.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">沒有找到符合條件的用戶</p>
        </div>
      ) : (
        // 如果有用戶，顯示用戶列表
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {/* 表格頭部 */}
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">用戶</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">電子郵件</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">註冊時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            {/* 表格主體 */}
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* 遍歷過濾後的用戶列表 */}
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  {/* 用戶頭像和名稱 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={user.photoURL || 'https://pub-6ee61ab59e054c0facbe8351ca1efce0.r2.dev/default-avatar.png'} alt={user.displayName} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</div>
                      </div>
                    </div>
                  </td>
                  {/* 用戶郵箱 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </td>
                  {/* 用戶角色 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                    }`}>
                      {user.role === 'admin' ? '管理員' : '會員'}
                    </span>
                  </td>
                  {/* 用戶註冊時間 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleString('zh-TW') : '未知'}
                  </td>
                  {/* 操作按鈕 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* 不允許修改當前用戶的角色 */}
                    {user.id !== currentUser.uid && (
                      <button
                        onClick={() => handleUpdateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                        className={`${
                          user.role === 'admin' 
                            ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300' 
                            : 'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300'
                        }`}
                      >
                        {user.role === 'admin' ? '降級為會員' : '升級為管理員'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 導出 UserManagement 組件
export default UserManagement;
