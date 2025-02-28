import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// PostContent 組件：顯示文章內容和圖片
function PostContent({ post, onImageClick }) {
  // 添加當前圖片索引狀態
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 判斷是否有圖片
  const hasImages = post.imageUrls?.length > 0 || post.imageUrl;
  // 獲取所有圖片URL的數組
  const allImageUrls = post.imageUrls?.length > 0 ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : []);

  // 下一張圖片
  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (allImageUrls.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === allImageUrls.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // 上一張圖片
  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (allImageUrls.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? allImageUrls.length - 1 : prevIndex - 1
      );
    }
  };

  // 點擊特定圖片指示器
  const goToImage = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  return (
    <>
      {/* 文章內容 */}
      <div className="prose dark:prose-invert max-w-none mb-6">
        <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
          {post.content}
        </pre>
      </div>

      {/* 文章圖片 - 修改為支持多張圖片 */}
      {hasImages && (
        <div className="mb-6 relative">
          <img
            src={allImageUrls[currentImageIndex]}
            alt="文章圖片"
            className="w-full h-auto rounded-lg cursor-pointer"
            onClick={() => onImageClick(allImageUrls[currentImageIndex])}
          />
          
          {/* 只有多張圖片時才顯示導航按鈕 */}
          {allImageUrls.length > 1 && (
            <>
              {/* 左箭頭 */}
              <button 
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
              >
                <FiChevronLeft size={20} />
              </button>
              
              {/* 右箭頭 */}
              <button 
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
              >
                <FiChevronRight size={20} />
              </button>
              
              {/* 圖片指示器 */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                {allImageUrls.map((_, index) => (
                  <button 
                    key={index}
                    onClick={(e) => goToImage(index, e)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      currentImageIndex === index 
                        ? 'bg-white w-4' 
                        : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default PostContent;
