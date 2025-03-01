import React, { useState } from 'react';

/**
 * 圖片預覽組件
 * 用於顯示已上傳或現有的圖片，並提供拖拽排序和刪除功能
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
  // 追蹤刪除按鈕的狀態（是否正在點擊）
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <div 
      className={`relative group border-2 ${isDraggedOver ? 'border-blue-500' : 'border-transparent'}`}
      draggable // 設置元素為可拖曳
      onDragStart={(e) => onDragStart(e, index, isCurrentImage)} // 開始拖曳時傳遞索引和圖片類型
      onDragEnd={onDragEnd} // 拖曳結束時的處理
      onDragOver={(e) => onDragOver(e, index, isCurrentImage)} // 拖曳經過時傳遞索引和圖片類型
    >
      {/* 圖片顯示區域 - 設置為固定高度並覆蓋適合的尺寸 */}
      <img 
        src={imageUrl} 
        alt={`${isCurrentImage ? '現有' : '新上傳'}圖片 ${index + 1}`} 
        className="w-full h-32 object-cover rounded-lg cursor-move" // 設置圖片樣式和游標為移動樣式
      />
      {/* 拖曳提示圖標 - 僅在滑鼠懸停時顯示（group-hover） */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" className="h-4 w-4">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.367 12.171L9.501 14V4.25a1.75 1.75 0 1 1 3.5 0V9.5l2.988.478c1.929.289 2.893.434 3.572.84c1.122.673 1.935 1.682 1.935 3.156c0 1.026-.254 1.715-.87 3.565c-.392 1.174-.587 1.76-.906 2.225a4 4 0 0 1-2.192 1.58c-.542.156-1.16.156-2.398.156h-1.05c-1.644 0-2.467 0-3.2-.302a4 4 0 0 1-.384-.183C9.8 20.637 9.281 20 8.244 18.722l-3.358-4.134a1.74 1.74 0 0 1 2.481-2.417M20 4.5h-4m4 0c0 .56-1.494 1.607-2 2m2-2c0-.56-1.494-1.607-2-2m-15.5 2h4m-4 0c0-.56 1.494-1.607 2-2m-2 2c0 .56 1.494 1.607 2 2" color="currentColor"/>
        </svg>
      </div>
      {/* 刪除按鈕 - 僅在滑鼠懸停時顯示（group-hover） */}
      <button
        type="button"
        onClick={() => {
          setIsDeleting(true); // 設置刪除狀態為真
          onRemove(index); // 調用父組件提供的刪除函數
        }}
        onMouseDown={() => setIsDeleting(true)} // 按下滑鼠時顯示刪除中圖標
        onMouseUp={() => setIsDeleting(false)} // 釋放滑鼠時恢復原圖標
        onMouseLeave={() => setIsDeleting(false)} // 滑鼠離開時恢復原圖標
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {/* 根據刪除狀態顯示不同的圖標 */}
        {isDeleting ? (
          // 刪除中圖標 - 垃圾桶打開狀態
          <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" fill-rule="evenodd" d="M9.774 5L3.758 3.94l.174-.986a.5.5 0 0 1 .58-.405L18.411 5h.088h-.087l1.855.327a.5.5 0 0 1 .406.58l-.174.984l-2.09-.368l-.8 13.594A2 2 0 0 1 15.615 22H8.386a2 2 0 0 1-1.997-1.883L5.59 6.5h12.69zH5.5zM9 9l.5 9H11l-.4-9zm4.5 0l-.5 9h1.5l.5-9zm-2.646-7.871l3.94.694a.5.5 0 0 1 .405.58l-.174.984l-4.924-.868l.174-.985a.5.5 0 0 1 .58-.405z"/>
          </svg>
        ) : (
          // 默認刪除圖標 - 垃圾桶關閉狀態
          <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" fill-rule="evenodd" d="m18.412 6.5l-.801 13.617A2 2 0 0 1 15.614 22H8.386a2 2 0 0 1-1.997-1.883L5.59 6.5H3.5v-1A.5.5 0 0 1 4 5h16a.5.5 0 0 1 .5.5v1zM10 2.5h4a.5.5 0 0 1 .5.5v1h-5V3a.5.5 0 0 1 .5-.5M9 9l.5 9H11l-.4-9zm4.5 0l-.5 9h1.5l.5-9z"/>
          </svg>
        )}
      </button>
    </div>
  );
}

export default ImagePreview; 