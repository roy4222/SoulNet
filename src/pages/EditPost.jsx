import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, r2Client } from '../utils/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/UI/BackButton';
import LoadingState from '../components/UI/LoadingState';
import SuccessMessage from '../components/UI/SuccessMessage';
import ImageUploader from '../components/Post/ImageUploader';
import ImagePreviewList from '../components/Post/ImagePreviewList';
import PostForm from '../components/Post/PostForm';
import { uploadImageToR2 } from '../utils/imageUtils';

/**
 * 編輯文章頁面組件
 * 允許用戶編輯現有文章的標題、內容、分類和圖片
 */
function EditPost() {
  // 從URL參數中獲取文章ID
  const { id } = useParams();
  const navigate = useNavigate();
  // 獲取當前用戶和管理員狀態
  const { currentUser, isAdmin } = useAuth();
  
  // 文章基本信息狀態
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

  // 拖拽相關狀態
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);

  /**
   * 處理檔案拖拽區域的拖拽事件
   * 防止瀏覽器默認行為
   */
  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * 處理檔案拖放
   * 當用戶拖放檔案到上傳區域時觸發
   */
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

  /**
   * 處理貼上事件
   * 允許用戶直接從剪貼板貼上圖片
   */
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

  /**
   * 在組件掛載時添加貼上事件監聽器
   * 在組件卸載時移除監聽器
   */
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isUploading]);

  /**
   * 從 Firebase 獲取分類數據
   * 在組件掛載時執行一次
   */
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

  /**
   * 檢查當前用戶是否有權限編輯此文章
   * @param {Object} postData - 文章數據
   * @returns {boolean} - 是否有編輯權限
   */
  const checkPermission = (postData) => {
    // 管理員可以編輯任何文章
    if (isAdmin()) return true;
    
    // 作者可以編輯自己的文章
    return currentUser && postData.author && postData.author.uid === currentUser.uid;
  };
  
  /**
   * 獲取文章數據
   * 在組件掛載和ID、用戶或管理員狀態變化時執行
   */
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
  
  /**
   * 處理圖片選擇
   * 當用戶選擇新圖片時觸發
   */
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
  
  /**
   * 移除新上傳的圖片
   * @param {number} index - 要移除的圖片索引
   */
  const handleRemoveNewImage = (index) => {
    // 計算在 imagePreviews 中的實際索引
    const actualIndex = currentImages.length + index;
    
    // 從 images 中移除
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    
    // 從 imagePreviews 中移除
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== actualIndex));
  };
  
  /**
   * 移除現有圖片
   * @param {number} index - 要移除的圖片索引
   */
  const handleRemoveCurrentImage = (index) => {
    // 從 currentImages 中移除
    setCurrentImages(prevImages => prevImages.filter((_, i) => i !== index));
    
    // 從 imagePreviews 中移除
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };
  
  /**
   * 處理拖拽開始
   * @param {Event} e - 拖拽事件
   * @param {number} index - 被拖拽項目的索引
   * @param {boolean} isCurrentImage - 是否為現有圖片
   */
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

  /**
   * 處理拖拽結束
   * 重新排序圖片
   */
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
      } else {
        // 從新上傳圖片移動到現有圖片
        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        setImages(newImages);
      }
    }

    // 重置拖拽狀態
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  /**
   * 處理拖拽進入
   * @param {Event} e - 拖拽事件
   * @param {number} index - 目標項目的索引
   * @param {boolean} isCurrentImage - 是否為現有圖片
   */
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

  /**
   * 處理表單提交
   * 上傳圖片並更新文章
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      setUploadError('');
      
      // 上傳新圖片並獲取URLs
      const newImageUrls = [];
      if (images.length > 0) {
        // 並行上傳所有新圖片
        const uploadPromises = images.map(image => uploadImageToR2(image, r2Client));
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
      
      // 更新文章到Firestore
      await updateDoc(doc(db, 'posts', id), updateData);
      
      // 顯示成功訊息並導航回文章頁面
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
          
          {/* 圖片上傳區域 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              文章圖片 (可選，最多20張)
            </label>
            
            <ImageUploader 
              onDragOver={handleFileDragOver}
              onDrop={handleDrop}
              onChange={handleImagesChange}
              isDisabled={isUploading || (currentImages.length + images.length) >= 20}
            />
            
            {uploadError && (
              <p className="mt-2 text-sm text-red-500">{uploadError}</p>
            )}
            
            {/* 圖片預覽區域 */}
            {imagePreviews.length > 0 && (
              <ImagePreviewList 
                currentImages={currentImages}
                images={images}
                imagePreviews={imagePreviews}
                draggedOverItem={draggedOverItem}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onRemoveCurrentImage={handleRemoveCurrentImage}
                onRemoveNewImage={handleRemoveNewImage}
              />
            )}
          </div>
          
          {/* 拖拽提示 */}
          {imagePreviews.length > 1 && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              提示：您可以拖拽圖片來調整順序
            </p>
          )}
          
          {/* 文章表單 */}
          <PostForm 
            title={title}
            setTitle={setTitle}
            content={content}
            setContent={setContent}
            category={category}
            setCategory={setCategory}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/post/${id}`)}
            isUploading={isUploading}
          />
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
