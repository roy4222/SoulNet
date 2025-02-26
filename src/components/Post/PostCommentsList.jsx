import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { motion } from 'framer-motion';

// 預設頭像
const DEFAULT_AVATAR = 'https://pub-6ee61ab59e054c0facbe8351ca1efce0.r2.dev/default-avatar.png';

// PostCommentsList 組件：評論列表和排序功能
function PostCommentsList({ comments, sortOrder, setSortOrder, formatTime }) {
  return (
    <>
      {/* 評論數量標題 */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        評論 ({comments?.length || 0})
      </h2>

      {/* 排序按鈕 */}
      <div className="flex justify-start mb-4 space-x-2">
        {/* 最新留言按鈕 */}
        <button
          onClick={() => setSortOrder('newest')}
          className={`px-4 py-2 rounded-full text-sm ${
            sortOrder === 'newest'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          } transition-colors duration-200`}
        >
          最新留言
        </button>
        {/* 最舊留言按鈕 */}
        <button
          onClick={() => setSortOrder('oldest')}
          className={`px-4 py-2 rounded-full text-sm ${
            sortOrder === 'oldest'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          } transition-colors duration-200`}
        >
          最舊留言
        </button>
      </div>

      {/* 評論列表容器 */}
      <div className="space-y-8">
        {/* 對評論進行排序和渲染 */}
        {[...(comments || [])]
          // 根據 sortOrder 對評論進行排序
          .sort((a, b) => {
            // 獲取評論的創建時間
            const timeA = a.createdAt?.toDate().getTime();
            const timeB = b.createdAt?.toDate().getTime();
            // 根據 sortOrder 決定排序方式
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
          })
          // 遍歷排序後的評論數組
          .map((comment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex gap-4 items-start"
            >
              {/* 評論者頭像 */}
              <img 
                src={comment.author?.photoURL || DEFAULT_AVATAR} 
                alt={comment.author?.displayName || '使用者'}
                className="w-12 h-12 rounded-full object-cover"
              />
              {/* 評論內容區塊 */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {/* 評論者信息和發布時間 */}
                <div className="flex items-center gap-2 mb-2">
                  {/* 顯示評論者名稱，如果沒有則顯示 '使用者' */}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {comment.author?.displayName || '使用者'}
                  </span>
                  {/* 顯示評論發布時間，格式化為相對時間 */}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(comment.createdAt?.toDate(), { addSuffix: true, locale: zhTW })}
                  </span>
                </div>
                {/* 評論文字內容 */}
                <p className="text-gray-700 dark:text-gray-300 text-lg whitespace-pre-wrap">{comment.content}</p>
              </div>
            </motion.div>
          ))}
        
        {/* 無評論時顯示提示 */}
        {(!comments || comments.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner"
          >
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              還沒有評論
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              成為第一個分享想法的人吧！
            </p>
          </motion.div>
        )}
      </div>
    </>
  );
}

export default PostCommentsList;
