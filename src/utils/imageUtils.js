/**
 * 獲取文件的ContentType
 * 
 * @param {File} file - 要處理的文件對象
 * @returns {string} - 返回文件的MIME類型
 * @description 根據文件擴展名確定適當的MIME類型，如果找不到預定義類型則返回文件自帶的類型
 */
export const getContentType = (file) => {
  // 從文件名中提取擴展名並轉為小寫
  const extension = file.name.split('.').pop().toLowerCase();
  // 定義常見圖片格式的MIME類型映射
  const types = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  // 返回對應的MIME類型，如果沒有匹配則使用文件自帶的類型
  return types[extension] || file.type;
};

/**
 * 上傳圖片到Cloudflare R2存儲
 * 
 * @param {File} file - 要上傳的文件對象
 * @param {Object} r2Client - Cloudflare R2客戶端實例
 * @returns {Promise<string>} - 返回上傳成功後的公開訪問URL
 * @throws {Error} - 上傳失敗時拋出錯誤
 * @description 將圖片文件上傳到Cloudflare R2存儲，並返回可公開訪問的URL
 */
export const uploadImageToR2 = async (file, r2Client) => {
  // 動態導入所需的AWS S3客戶端命令和UUID生成工具
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { v4: uuidv4 } = await import('uuid');
  
  // 從文件名中提取擴展名
  const fileExtension = file.name.split('.').pop();
  // 使用UUID生成唯一文件名，避免文件名衝突
  const fileName = `${uuidv4()}.${fileExtension}`;
  
  try {
    // 將File對象轉換為ArrayBuffer，以便上傳
    const buffer = await file.arrayBuffer();

    // 創建上傳命令
    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_R2_BUCKET, // 從環境變量獲取存儲桶名稱
      Key: fileName, // 使用生成的唯一文件名
      Body: buffer, // 文件內容
      ContentType: getContentType(file), // 設置正確的內容類型
      CacheControl: 'public, max-age=31536000', // 設置緩存控制，一年有效期
    });

    // 發送上傳命令
    await r2Client.send(command);
    
    // 構建Cloudflare R2的公開訪問URL
    const endpoint = import.meta.env.VITE_R2_ENDPOINT;
    const publicUrl = `https://${endpoint}/${fileName}`;
    console.log('生成的publicUrl:', publicUrl);
    return publicUrl;
  } catch (error) {
    // 記錄錯誤並向上拋出，以便調用者處理
    console.error('上傳圖片失敗:', error);
    throw error;
  }
}; 