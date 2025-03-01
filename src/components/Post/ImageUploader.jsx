import React from 'react';

/**
 * 圖片上傳器組件
 * 
 * @param {Function} onDragOver - 處理拖曳檔案經過上傳區域的事件
 * @param {Function} onDrop - 處理檔案拖放到上傳區域的事件
 * @param {Function} onChange - 處理透過點擊選擇檔案的事件
 * @param {boolean} isDisabled - 控制上傳器是否禁用
 */
function ImageUploader({ onDragOver, onDrop, onChange, isDisabled }) {
  return (
    <div className="flex items-center justify-center w-full">
      <label 
        htmlFor="images" 
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={onDragOver} // 當檔案被拖曳到上傳區域上方時觸發
        onDrop={onDrop} // 當檔案被放置到上傳區域時觸發
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {/* 雲端上傳圖示 */}
          <svg className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          {/* 上傳提示文字 */}
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">點擊上傳</span> 或拖放圖片
          </p>
          {/* 檔案格式與限制說明 */}
          <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF (最多10張，每張最大 5MB)</p>
        </div>
        {/* 隱藏的檔案輸入框 */}
        <input
          id="images"
          type="file"
          accept="image/*" // 限制只能選擇圖片檔案
          onChange={onChange} // 當選擇檔案後觸發
          className="hidden" // 隱藏原生檔案選擇器
          disabled={isDisabled} // 根據isDisabled狀態禁用輸入框
          multiple // 允許選擇多個檔案
        />
      </label>
    </div>
  );
}

export default ImageUploader; 