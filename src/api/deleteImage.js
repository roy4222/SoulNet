import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../utils/firebase';

/**
 * 刪除 R2 存儲中的圖片
 * 
 * @deprecated 不推薦直接從前端使用此函數，因為會遇到 CORS 和安全憑證問題。
 * 應該設置後端 API 或 Cloud Functions 來處理圖片刪除。
 * 請參考 TODO.md 文件中的建議解決方案。
 * 
 * 錯誤示例：
 * "TypeError: Failed to fetch" - 這是因為瀏覽器無法直接向 R2 API 發送請求
 * 
 * @param {string} imageUrl - 圖片的完整 URL
 * @returns {Promise<boolean>} - 刪除成功返回 true，失敗返回 false
 */
export const deleteImageFromR2 = async (imageUrl) => {
  if (!imageUrl) {
    console.error('刪除圖片失敗：未提供圖片 URL');
    return false;
  }

  try {
    console.warn('警告：直接從前端刪除 R2 圖片可能會失敗。建議設置後端 API 來處理此操作。');
    
    // 從 URL 中提取文件名
    const fileName = imageUrl.split('/').pop();
    
    if (!fileName) {
      console.error('刪除圖片失敗：無法從 URL 提取文件名');
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: import.meta.env.VITE_R2_BUCKET,
      Key: fileName,
    });

    await r2Client.send(command);
    console.log(`成功從 R2 刪除圖片: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`刪除 R2 圖片失敗 (${imageUrl}):`, error);
    return false;
  }
};
