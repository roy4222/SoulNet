import React from 'react';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';

function PostInteractionButtons({ post, currentUser, onLike, navigate }) {
  return (
    <div 
      className="flex items-center gap-4 text-gray-500 dark:text-gray-400 interaction-buttons"
      onClick={e => e.preventDefault()}
    >
      {/* 點讚按鈕 */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLike(post);
        }}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group relative"
      >
        {post.likes?.includes(currentUser?.uid) 
          ? <FavoriteRoundedIcon className="w-6 h-6 text-red-500" />
          : <FavoriteBorderRoundedIcon className="w-6 h-6 group-hover:text-red-500" />
        }
        <span className="text-sm font-medium">{post.likes?.length || 0}</span>
        <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">點讚</span>
      </button>

      {/* 評論按鈕 */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/post/${post.id}#comments`);
        }}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group relative"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="group-hover:text-blue-500">
          <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 1 0-9-9c0 1.488.36 2.891 1 4.127L3 21l4.873-1c1.236.64 2.64 1 4.127 1"/>
        </svg>
        <span className="text-sm font-medium">{post.comments?.length || 0}</span>
        <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">評論</span>
      </button>

      {/* 轉發按鈕 */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group relative"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 21 21" className="group-hover:text-green-500">
          <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
            <path d="m13.5 13.5l3 3l3-3"/>
            <path d="M9.5 4.5h3a4 4 0 0 1 4 4v8m-9-9l-3-3l-3 3"/>
            <path d="M11.5 16.5h-3a4 4 0 0 1-4-4v-8"/>
          </g>
        </svg>
        <span className="text-sm font-medium">{post.reposts?.length || 0}</span>
        <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">轉發</span>
      </button>

      {/* 分享按鈕 */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onShare(post);
        }}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group relative"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="group-hover:text-blue-500">
          <path fill="currentColor" d="M13 14h-2a9 9 0 0 0-7.968 4.81A10 10 0 0 1 3 18C3 12.477 7.477 8 13 8V3l10 8l-10 8z"/>
        </svg>
        <span className="text-sm font-medium">{post.shares || 0}</span>
        <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">分享</span>
      </button>

      {/* 觀看次數 */}
      <div className="flex items-center gap-2 p-2 group relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" className="text-gray-500 dark:text-gray-400 w-5 h-5">
          <path fill="none" stroke="currentColor" strokeWidth="2" d="M16 5a4 4 0 1 1-8 0a4 4 0 0 1 8 0Zm-1 18v-6h3v-2c0-3.34-2.76-5.97-6-6c-3.21.03-6 2.66-6 6v2h3v6m-5.5 0h17z"/>
        </svg>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{post.views || 0}</span>
        <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">觀看次數</span>
      </div>
    </div>
  );
}

export default PostInteractionButtons; 