import React from 'react';

// PostContent 組件：顯示文章內容和圖片
function PostContent({ post, onImageClick }) {
  return (
    <>
      {/* 文章內容 */}
      <div className="prose dark:prose-invert max-w-none mb-6">
        <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
          {post.content}
        </pre>
      </div>

      {/* 文章圖片 */}
      {post.imageUrl && (
        <div className="mb-6">
          <img
            src={post.imageUrl}
            alt="文章圖片"
            className="w-full h-auto rounded-lg cursor-pointer"
            onClick={() => onImageClick(post.imageUrl)}
          />
        </div>
      )}
    </>
  );
}

export default PostContent;
