/**
 * ShareUtils.js - 分享功能工具集
 * 提供通用的分享功能，可在不同組件中重複使用
 */

/**
 * 複製連結到剪貼簿並顯示成功訊息
 * @param {string} url - 要複製的URL
 * @param {Function} setSuccessMessageType - 設置成功訊息類型的函數
 * @param {Function} setShowSuccess - 控制成功訊息顯示的函數
 * @param {number} duration - 成功訊息顯示的時間（毫秒）
 */
export const shareLink = (url, setSuccessMessageType, setShowSuccess, duration = 3000) => {
  console.log('ShareUtils.shareLink 被調用，URL:', url);
  
  // 創建一個臨時的textarea元素
  const textarea = document.createElement('textarea');
  // 設置textarea的值為要複製的文本
  textarea.value = url;
  // 將textarea添加到DOM中
  document.body.appendChild(textarea);
  // 選中textarea的內容
  textarea.select();
  // 執行複製命令
  const success = document.execCommand('copy');
  console.log('document.execCommand 結果:', success);
  
  // 從DOM中移除textarea
  document.body.removeChild(textarea);

  // 設置成功訊息類型
  setSuccessMessageType('share');
  // 顯示成功訊息
  setShowSuccess(true);
  console.log('成功訊息已顯示，類型: share');
  
  // 指定時間後隱藏成功訊息
  setTimeout(() => {
    setShowSuccess(false);
    console.log('成功訊息已隱藏');
  }, duration);
};

/**
 * 使用現代的 Clipboard API 複製連結（如果瀏覽器支持）
 * @param {string} url - 要複製的URL
 * @param {Function} setSuccessMessageType - 設置成功訊息類型的函數
 * @param {Function} setShowSuccess - 控制成功訊息顯示的函數
 * @param {number} duration - 成功訊息顯示的時間（毫秒）
 */
export const shareWithClipboardAPI = async (url, setSuccessMessageType, setShowSuccess, duration = 3000) => {
  console.log('ShareUtils.shareWithClipboardAPI 被調用，URL:', url);
  
  try {
    await navigator.clipboard.writeText(url);
    console.log('navigator.clipboard.writeText 成功');
    
    setSuccessMessageType('share');
    setShowSuccess(true);
    console.log('成功訊息已顯示，類型: share');
    
    setTimeout(() => {
      setShowSuccess(false);
      console.log('成功訊息已隱藏');
    }, duration);
  } catch (error) {
    console.error('無法使用 Clipboard API，嘗試使用備用方法:', error);
    // 如果 Clipboard API 失敗，使用備用方法
    shareLink(url, setSuccessMessageType, setShowSuccess, duration);
  }
};

/**
 * 根據瀏覽器支持選擇最佳的分享方法
 * @param {string} url - 要分享的URL
 * @param {Function} setSuccessMessageType - 設置成功訊息類型的函數
 * @param {Function} setShowSuccess - 控制成功訊息顯示的函數
 * @param {number} duration - 成功訊息顯示的時間（毫秒）
 */
export const shareUrl = (url, setSuccessMessageType, setShowSuccess, duration = 3000) => {
  console.log('ShareUtils.shareUrl 被調用，參數:', {
    url,
    setSuccessMessageType: typeof setSuccessMessageType === 'function' ? '函數' : '非函數',
    setShowSuccess: typeof setShowSuccess === 'function' ? '函數' : '非函數',
    duration
  });

  // 檢查參數是否正確
  if (typeof setSuccessMessageType !== 'function') {
    console.error('setSuccessMessageType 不是函數!');
    return;
  }
  
  if (typeof setShowSuccess !== 'function') {
    console.error('setShowSuccess 不是函數!');
    return;
  }

  // 檢查是否支持 Clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    console.log('使用 Clipboard API 分享');
    shareWithClipboardAPI(url, setSuccessMessageType, setShowSuccess, duration);
  } else {
    console.log('使用備用方法分享');
    // 使用備用方法
    shareLink(url, setSuccessMessageType, setShowSuccess, duration);
  }
};

export default {
  shareLink,
  shareWithClipboardAPI,
  shareUrl
};
