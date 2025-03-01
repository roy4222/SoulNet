import React from 'react';

/**
 * 圖片預覽組件
 * 
 * @param {string} imageUrl - 圖片的URL
 * @param {number} index - 圖片在列表中的索引
 * @param {boolean} isCurrentImage - 是否為現有圖片（true）或新上傳圖片（false）
 * @param {boolean} isDraggedOver - 是否有其他元素正在被拖曳到此元素上
 * @param {Function} onDragStart - 開始拖曳時的處理函數
 * @param {Function} onDragEnd - 結束拖曳時的處理函數
 * @param {Function} onDragOver - 拖曳經過時的處理函數
 * @param {Function} onRemove - 移除圖片的處理函數
 */
function ImagePreview({ 
  imageUrl, 
  index, 
  isCurrentImage, 
  isDraggedOver, 
  onDragStart, 
  onDragEnd, 
  onDragOver, 
  onRemove 
}) {
  return (
    <div 
      className={`relative group border-2 ${isDraggedOver ? 'border-blue-500' : 'border-transparent'}`}
      draggable // 設置元素為可拖曳
      onDragStart={(e) => onDragStart(e, index, isCurrentImage)} // 開始拖曳時傳遞索引和圖片類型
      onDragEnd={onDragEnd} // 拖曳結束時的處理
      onDragOver={(e) => onDragOver(e, index, isCurrentImage)} // 拖曳經過時傳遞索引和圖片類型
    >
      {/* 圖片顯示區域 */}
      <img 
        src={imageUrl} 
        alt={`${isCurrentImage ? '現有' : '新上傳'}圖片 ${index + 1}`} 
        className="w-full h-32 object-cover rounded-lg cursor-move" // 設置圖片樣式和游標為移動樣式
      />
      {/* 拖曳提示圖標 - 僅在滑鼠懸停時顯示 */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a2.5 2.5 0 015 0v6a2.5 2.5 0 01-5 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
      </div>
      {/* 刪除按鈕 - 僅在滑鼠懸停時顯示 */}
      <button
        type="button"
        onClick={() => onRemove(index)} // 點擊時調用移除函數並傳遞索引
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default ImagePreview; 