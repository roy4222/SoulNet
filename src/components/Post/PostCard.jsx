import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PostInteractionButtons from './PostInteractionButtons';

const DEFAULT_AVATAR = 'https://pub-6ee61ab59e054c0facbe8351ca1efce0.r2.dev/default-avatar.png';

function PostCard({ 
  post, 
  users, 
  currentUser, 
  categories,
  expandedPosts,
  onToggleExpand,
  onImageClick,
  onLike,
  onShare,
  navigate 
}) {
  return (
    <Link 
      to={`/post/${post.id}`}
      onClick={() => window.scrollTo(0, 0)}
    >
      <motion.article 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4 cursor-pointer relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* 文章標題和作者資訊 */}
        <div className="flex items-center gap-3 mb-4">
          {/* 作者頭像 */}
          <img 
            src={users[post.author?.uid]?.photoURL || DEFAULT_AVATAR} 
            alt={users[post.author?.uid]?.displayName || '匿名用戶'}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            {/* 作者名稱或郵箱 */}
            <h3 className="font-medium text-gray-900 dark:text-white">
              {users[post.author?.uid]?.displayName || '匿名用戶'}
            </h3>
            {/* 發文時間 */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {post.createdAt?.toDate().toLocaleString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* 文章標題 */}
        <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          {post.title}
        </h2>

        {/* 文章內容區塊 */}
        <div className="mb-4">
          <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {expandedPosts[post.id] 
              ? (post.content || '') 
              : `${(post.content || '').slice(0, 100)}${(post.content || '').length > 100 ? '...' : ''}`
            }
          </div>
          {post.content && post.content.length > 100 && (
            <button
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleExpand(post.id);
              }}
            >
              {expandedPosts[post.id] ? '' : '顯示更多'}
            </button>
          )}
        </div>

        {/* 文章圖片 */}
        {post.imageUrl && (
          <div 
            className="mb-4 rounded-lg overflow-hidden transition-shadow duration-300 cursor-zoom-in"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onImageClick(post.imageUrl);
            }}
          >
            <img
              src={post.imageUrl}
              alt="文章圖片"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 文章分類 */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {categories.find(c => c.id === (post.topic || post.category))?.name || '未分類'}
          </span>
        </div>

        {/* 互動按鈕 */}
        <PostInteractionButtons 
          post={post}
          currentUser={currentUser}
          onLike={onLike}
          navigate={navigate}
          onShare={onShare}
        />
      </motion.article>
    </Link>
  );
}

export default PostCard; 