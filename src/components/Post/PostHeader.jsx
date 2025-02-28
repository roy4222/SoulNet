import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PostActions from './PostActions';

// 預設頭像
const DEFAULT_AVATAR = 'https://pub-6ee61ab59e054c0facbe8351ca1efce0.r2.dev/default-avatar.png';

// PostHeader 組件：顯示文章標題、作者資訊
function PostHeader({ post, onEdit }) {
  return (
    <div className="flex justify-between items-start">
      <div className="flex-1">
        {/* 文章標題 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {post.title}
        </h1>
        
        {/* 文章標題和作者資訊 */}
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={post.author?.photoURL || DEFAULT_AVATAR}  
            alt={post.author?.displayName || '使用者'}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {post.author?.displayName || '使用者'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {post.createdAt?.toDate().getFullYear()}年{post.createdAt?.toDate().getMonth() + 1}月{post.createdAt?.toDate().getDate()}日 上午{post.createdAt?.toDate().getHours()}:{post.createdAt?.toDate().getMinutes() < 10 ? '0' + post.createdAt?.toDate().getMinutes() : post.createdAt?.toDate().getMinutes()}
            </p>
          </div>
        </div>
      </div>
      
      {/* 添加文章操作按鈕 */}
      <PostActions post={post} onEdit={onEdit} />
    </div>
  );
}

export default PostHeader;
