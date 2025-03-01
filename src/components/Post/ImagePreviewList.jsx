import React from 'react';
import ImagePreview from './ImagePreview';

/**
 * 圖片預覽列表組件
 * 
 * @param {Array} currentImages - 現有的圖片URL陣列
 * @param {Array} images - 新上傳的圖片檔案陣列
 * @param {Array} imagePreviews - 所有圖片的預覽URL陣列（包含現有和新上傳的）
 * @param {Object} draggedOverItem - 目前被拖曳經過的項目資訊
 * @param {Function} onDragStart - 開始拖曳時的處理函數
 * @param {Function} onDragEnd - 結束拖曳時的處理函數
 * @param {Function} onDragOver - 拖曳經過時的處理函數
 * @param {Function} onRemoveCurrentImage - 移除現有圖片的處理函數
 * @param {Function} onRemoveNewImage - 移除新上傳圖片的處理函數
 */
function ImagePreviewList({ 
  currentImages, 
  images, 
  imagePreviews, 
  draggedOverItem, 
  onDragStart, 
  onDragEnd, 
  onDragOver, 
  onRemoveCurrentImage, 
  onRemoveNewImage 
}) {
  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
      {/* 現有圖片預覽區塊 - 顯示已存在的圖片 */}
      {currentImages.map((imageUrl, index) => (
        <ImagePreview
          key={`current-${index}`} // 使用唯一key值以優化渲染
          imageUrl={imageUrl} // 圖片URL
          index={index} // 圖片索引
          isCurrentImage={true} // 標記為現有圖片
          isDraggedOver={draggedOverItem && draggedOverItem.index === index && draggedOverItem.isCurrentImage} // 判斷是否為拖曳目標
          onDragStart={onDragStart} // 拖曳開始事件處理
          onDragEnd={onDragEnd} // 拖曳結束事件處理
          onDragOver={onDragOver} // 拖曳經過事件處理
          onRemove={onRemoveCurrentImage} // 移除現有圖片的處理函數
        />
      ))}
      
      {/* 新上傳圖片預覽區塊 - 顯示使用者剛上傳的圖片 */}
      {images.map((_, index) => {
        // 計算在imagePreviews陣列中的實際索引位置
        const previewIndex = currentImages.length + index;
        return (
          <ImagePreview
            key={`new-${index}`} // 使用唯一key值以優化渲染
            imageUrl={imagePreviews[previewIndex]} // 從預覽陣列中獲取對應的URL
            index={index} // 在新上傳圖片中的索引
            isCurrentImage={false} // 標記為新上傳圖片
            isDraggedOver={draggedOverItem && draggedOverItem.index === index && !draggedOverItem.isCurrentImage} // 判斷是否為拖曳目標
            onDragStart={onDragStart} // 拖曳開始事件處理
            onDragEnd={onDragEnd} // 拖曳結束事件處理
            onDragOver={onDragOver} // 拖曳經過事件處理
            onRemove={onRemoveNewImage} // 移除新上傳圖片的處理函數
          />
        );
      })}
    </div>
  );
}

export default ImagePreviewList; 