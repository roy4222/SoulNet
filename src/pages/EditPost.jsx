import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, storage } from '../utils/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import { r2Client } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/UI/BackButton';
import LoadingState from '../components/UI/LoadingState';
import SuccessMessage from '../components/UI/SuccessMessage';

// 獲取文件的ContentType
const getContentType = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  const types = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return types[extension] || file.type;
};

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole, isAdmin } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [post, setPost] = useState(null);
  
  // 分類狀態
  const [categories, setCategories] = useState([]);

  // 圖片相關狀態
  const [images, setImages] = useState([]); // 新上傳的圖片檔案
  const [imagePreviews, setImagePreviews] = useState([]); // 所有圖片預覽 (包含現有和新上傳)
  const [currentImages, setCurrentImages] = useState([]); // 現有的圖片 URL
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // 新增拖拽相關狀態
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);

  // 將原本的 handleDragOver 函數重命名為 handleFileDragOver
  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 處理檔案拖放
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 如果正在加載中，則不處理
    if (isUploading) return;

    // 獲取拖放的檔案
    const files = e.dataTransfer.files;
    // 如果有檔案，則調用handleImagesChange處理
    if (files && files.length > 0) {
      handleImagesChange({ target: { files } });
    }
  };

  // 處理貼上事件
  const handlePaste = (e) => {
    // 如果正在加載中，則不處理
    if (isUploading) return;

    // 獲取剪貼板數據
    const items = e.clipboardData?.items;
    if (!items) return;

    // 遍歷剪貼板項目
    for (const item of items) {
      // 如果是圖片類型
      if (item.type.startsWith('image/')) {
        // 獲取檔案並調用handleImagesChange處理
        const file = item.getAsFile();
        handleImagesChange({ target: { files: [file] } });
        break;
      }
    }
  };

  // 在組件掛載時添加貼上事件監聽器
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isUploading]);

  // 從 Firebase 獲取分類數據
  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesRef = collection(db, 'topics');
      const snapshot = await getDocs(categoriesRef);
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    };

    fetchCategories();
  }, []);

  // 檢查當前用戶是否有權限編輯此文章
  const checkPermission = (postData) => {
    // 管理員可以編輯任何文章
    if (isAdmin()) return true;
    
    // 作者可以編輯自己的文章
    return currentUser && postData.author && postData.author.uid === currentUser.uid;
  };
  
  // 獲取文章數據
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', id));
        
        if (postDoc.exists()) {
          const postData = postDoc.data();
          setPost({ id: postDoc.id, ...postData });
          
          // 檢查權限
          if (!checkPermission(postData)) {
            setError('您沒有權限編輯此文章');
            return;
          }
          
          // 設置表單數據
          setTitle(postData.title || '');
          setContent(postData.content || '');
          setCategory(postData.category || 'other');
          
          // 設置當前圖片
          if (postData.imageURL) {
            // 兼容舊版單圖片格式
            setCurrentImages([postData.imageURL]);
            setImagePreviews([postData.imageURL]);
          } else if (postData.imageUrls && postData.imageUrls.length > 0) {
            // 新版多圖片格式
            setCurrentImages(postData.imageUrls);
            setImagePreviews(postData.imageUrls);
          }
        } else {
          setError('找不到這篇文章');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('載入文章時發生錯誤');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPost();
  }, [id, currentUser, isAdmin]);
  
  // 處理圖片選擇
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // 計算當前總圖片數 (現有圖片 + 新選擇的圖片)
      const totalImages = currentImages.length + images.length + files.length;
      
      // 檢查添加新圖片後總數是否超過限制
      if (totalImages > 10) {
        setUploadError('最多只能上傳10張圖片');
        return;
      }

      // 檢查每個文件的大小
      const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setUploadError('圖片大小不能超過5MB');
        return;
      }

      // 添加新圖片到現有圖片數組
      setImages(prevImages => [...prevImages, ...files]);

      // 為每個新圖片創建預覽URL
      const newPreviews = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          if (newPreviews.length === files.length) {
            setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
      
      setUploadError('');
    }
  };
  
  // 移除新上傳的圖片
  const handleRemoveNewImage = (index) => {
    // 計算在 imagePreviews 中的實際索引
    const actualIndex = currentImages.length + index;
    
    // 從 images 中移除
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    
    // 從 imagePreviews 中移除
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== actualIndex));
  };
  
  // 移除現有圖片
  const handleRemoveCurrentImage = (index) => {
    // 從 currentImages 中移除
    setCurrentImages(prevImages => prevImages.filter((_, i) => i !== index));
    
    // 從 imagePreviews 中移除
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };
  
  // 上傳圖片到 R2
  const uploadImageToR2 = async (file) => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    try {
      // 將File轉換為ArrayBuffer
      const buffer = await file.arrayBuffer();

      const command = new PutObjectCommand({
        Bucket: import.meta.env.VITE_R2_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: getContentType(file),
        CacheControl: 'public, max-age=31536000',
      });

      await r2Client.send(command);
      
      // 使用Cloudflare R2的公開訪問URL
      const endpoint = import.meta.env.VITE_R2_ENDPOINT;
      const publicUrl = `https://${endpoint}/${fileName}`;
      console.log('生成的publicUrl:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('上傳圖片失敗:', error);
      throw error;
    }
  };
  
  // 處理拖拽開始
  const handleDragStart = (e, index, isCurrentImage) => {
    // 設置拖拽項目的索引和類型
    setDraggedItem({ index, isCurrentImage });
    // 設置拖拽效果為移動
    e.dataTransfer.effectAllowed = 'move';
    // 設置拖拽圖像為透明（使用自定義拖拽視覺效果）
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 透明圖片
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  // 處理拖拽結束
  const handleDragEnd = () => {
    // 如果沒有拖拽項目或拖拽目標，則不執行任何操作
    if (!draggedItem || !draggedOverItem) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    // 獲取拖拽項目和目標的索引和類型
    const { index: draggedIndex, isCurrentImage: isDraggedCurrent } = draggedItem;
    const { index: draggedOverIndex, isCurrentImage: isDraggedOverCurrent } = draggedOverItem;

    // 創建新的圖片預覽數組
    let newImagePreviews = [...imagePreviews];
    
    // 計算實際索引
    let actualDraggedIndex = isDraggedCurrent ? draggedIndex : currentImages.length + draggedIndex;
    let actualDraggedOverIndex = isDraggedOverCurrent ? draggedOverIndex : currentImages.length + draggedOverIndex;

    // 移動預覽圖片
    const draggedPreview = newImagePreviews[actualDraggedIndex];
    newImagePreviews.splice(actualDraggedIndex, 1);
    newImagePreviews.splice(actualDraggedOverIndex, 0, draggedPreview);
    setImagePreviews(newImagePreviews);

    // 更新實際圖片數組
    if (isDraggedCurrent && isDraggedOverCurrent) {
      // 兩者都是現有圖片
      const newCurrentImages = [...currentImages];
      const draggedImage = newCurrentImages[draggedIndex];
      newCurrentImages.splice(draggedIndex, 1);
      newCurrentImages.splice(draggedOverIndex, 0, draggedImage);
      setCurrentImages(newCurrentImages);
    } else if (!isDraggedCurrent && !isDraggedOverCurrent) {
      // 兩者都是新上傳圖片
      const newImages = [...images];
      const draggedImage = newImages[draggedIndex];
      newImages.splice(draggedIndex, 1);
      newImages.splice(draggedOverIndex, 0, draggedImage);
      setImages(newImages);
    } else {
      // 一個是現有圖片，一個是新上傳圖片
      // 這種情況比較複雜，需要在兩個數組之間移動
      if (isDraggedCurrent) {
        // 從現有圖片移動到新上傳圖片
        const newCurrentImages = [...currentImages];
        const draggedImage = newCurrentImages[draggedIndex];
        newCurrentImages.splice(draggedIndex, 1);
        setCurrentImages(newCurrentImages);
        
        // 由於是URL而不是File對象，我們不能直接添加到images數組
        // 但我們可以更新預覽，並在提交時處理
        // 這裡我們只需確保預覽順序正確
      } else {
        // 從新上傳圖片移動到現有圖片
        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        setImages(newImages);
        
        // 同樣，我們不能直接將File對象添加到currentImages
        // 但我們可以確保預覽順序正確
      }
    }

    // 重置拖拽狀態
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  // 處理拖拽進入
  const handleDragOver = (e, index, isCurrentImage) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 如果拖拽項目與目標相同，則不執行任何操作
    if (draggedItem && 
        draggedItem.index === index && 
        draggedItem.isCurrentImage === isCurrentImage) {
      return;
    }
    
    // 設置拖拽目標
    setDraggedOverItem({ index, isCurrentImage });
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      setUploadError('');
      
      // 上傳新圖片並獲取URLs
      const newImageUrls = [];
      if (images.length > 0) {
        // 並行上傳所有新圖片
        const uploadPromises = images.map(image => uploadImageToR2(image));
        const urls = await Promise.all(uploadPromises);
        newImageUrls.push(...urls);
      }
      
      // 根據預覽順序重新排列圖片URLs
      let allImageUrls = [];
      
      // 遍歷所有預覽，按照預覽順序構建最終的URL數組
      for (let i = 0; i < imagePreviews.length; i++) {
        if (i < currentImages.length) {
          // 這是現有圖片
          allImageUrls.push(currentImages[i]);
        } else {
          // 這是新上傳的圖片
          const newIndex = i - currentImages.length;
          if (newIndex < newImageUrls.length) {
            allImageUrls.push(newImageUrls[newIndex]);
          }
        }
      }
      
      // 更新文章數據
      const updateData = {
        title,
        content,
        category,
        updatedAt: Timestamp.now()
      };
      
      // 添加圖片URLs到更新數據中
      if (post.imageURL && allImageUrls.length > 0) {
        // 如果原來是單圖片格式，現在轉為多圖片格式
        delete updateData.imageURL;
        updateData.imageUrls = allImageUrls;
      } else if (post.imageUrls && allImageUrls.length > 0) {
        // 如果原來就是多圖片格式
        updateData.imageUrls = allImageUrls;
      } else if (post.imageURL && allImageUrls.length === 0) {
        // 如果原來是單圖片格式，現在刪除所有圖片
        updateData.imageURL = null;
      } else if (post.imageUrls && allImageUrls.length === 0) {
        // 如果原來是多圖片格式，現在刪除所有圖片
        updateData.imageUrls = [];
      }
      
      await updateDoc(doc(db, 'posts', id), updateData);
      
      // 顯示成功訊息
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/post/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating post:', error);
      setUploadError('更新文章時發生錯誤');
    } finally {
      setIsUploading(false);
    }
  };
  
  // 如果正在加載或有錯誤，顯示相應狀態
  if (isLoading || error) {
    return <LoadingState isLoading={isLoading} error={error} />;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8"
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* 返回按鈕 */}
        <BackButton navigate={navigate} />
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">編輯文章</h1>
          
          <form onSubmit={handleSubmit}>
            {/* 標題輸入 */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                標題 (可選)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="請輸入文章標題"
              />
            </div>
            
            {/* 分類選擇 */}
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                分類 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 圖片上傳 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                文章圖片 (可選，最多10張)
              </label>
              
              {/* 圖片上傳區域 */}
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="images" 
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700" 
                  onDragOver={handleFileDragOver}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">點擊上傳</span> 或拖放圖片
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF (最多10張，每張最大 5MB)</p>
                  </div>
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    onChange={handleImagesChange}
                    className="hidden"
                    disabled={isUploading || (currentImages.length + images.length) >= 10}
                    multiple
                  />
                </label>
              </div>
              
              {uploadError && (
                <p className="mt-2 text-sm text-red-500">{uploadError}</p>
              )}
              
              {/* 圖片預覽區域 */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* 現有圖片預覽 */}
                  {currentImages.map((imageUrl, index) => (
                    <div 
                      key={`current-${index}`} 
                      className={`relative group border-2 ${draggedOverItem && draggedOverItem.index === index && draggedOverItem.isCurrentImage ? 'border-blue-500' : 'border-transparent'}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, true)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index, true)}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`現有圖片 ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-lg cursor-move"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a2.5 2.5 0 015 0v6a2.5 2.5 0 01-5 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCurrentImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* 新上傳圖片預覽 */}
                  {images.map((_, index) => {
                    const previewIndex = currentImages.length + index;
                    return (
                      <div 
                        key={`new-${index}`} 
                        className={`relative group border-2 ${draggedOverItem && draggedOverItem.index === index && !draggedOverItem.isCurrentImage ? 'border-blue-500' : 'border-transparent'}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index, false)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index, false)}
                      >
                        <img 
                          src={imagePreviews[previewIndex]} 
                          alt={`新上傳圖片 ${index + 1}`} 
                          className="w-full h-32 object-cover rounded-lg cursor-move"
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a2.5 2.5 0 015 0v6a2.5 2.5 0 01-5 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                          </svg>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* 拖拽提示 */}
            {imagePreviews.length > 1 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                提示：您可以拖拽圖片來調整順序
              </p>
            )}
            
            {/* 內容輸入 */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                內容 (可選)
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[200px]"
                placeholder="請輸入文章內容"
              />
            </div>
            
            {/* 提交按鈕 */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/post/${id}`)}
                className="mr-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUploading}
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    處理中...
                  </span>
                ) : '更新文章'}
              </button>
            </div>
          </form>
        </motion.div>
        
        {/* 成功訊息 */}
        <SuccessMessage
          show={showSuccess}
          message="文章已成功更新！"
        />
      </div>
    </motion.div>
  );
}

export default EditPost;
