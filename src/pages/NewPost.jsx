// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, r2Client } from '../utils/firebase';
import { uploadImageToR2 } from '../utils/imageUtils';
import ScrollToTopButton from '../components/ScrollToTopButton';
import BackButton from '../components/UI/BackButton';
import ImageUploader from '../components/Post/ImageUploader';
import ImagePreviewList from '../components/Post/ImagePreviewList';
import PostForm from '../components/Post/PostForm';

// 定義 NewPost 組件
export default function NewPost() {
    // 使用 useState 鉤子來管理表單狀態
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState(''); // 初始值設為空字串
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [images, setImages] = useState([]); // 改為存儲多張圖片
    const [imagePreviews, setImagePreviews] = useState([]); // 改為存儲多張圖片預覽
    const [categories, setCategories] = useState([]); // 存儲分類列表
    const [loadingCategories, setLoadingCategories] = useState(true); // 添加加載狀態
    
    // 拖拽相關狀態 (為了與 ImagePreviewList 組件兼容)
    const [draggedItem, setDraggedItem] = useState(null);
    const [draggedOverItem, setDraggedOverItem] = useState(null);
    
    // 使用 useNavigate 鉤子來進行路由導航
    const navigate = useNavigate();
    
    // 獲取 Firebase 身份驗證實例
    const auth = getAuth();

    // 處理檔案拖放區域的拖拽事件
    const handleFileDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // 處理檔案拖放
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 如果正在加載中，則不處理
        if (loading) return;

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
        if (loading) return;

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
    }, [loading]);

    // 處理圖片選擇
    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // 檢查添加新圖片後總數是否超過限制
            if (images.length + files.length > 20) {
                setError('最多只能上傳20張圖片');
                return;
            }

            // 檢查每個文件的大小
            const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                setError('圖片大小不能超過5MB');
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
            
            setError('');
        }
    };

    // 移除圖片
    const handleRemoveImage = (index) => {
        setImages(prevImages => prevImages.filter((_, i) => i !== index));
        setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
    };
    
    // 處理拖拽開始 (為了與 ImagePreviewList 組件兼容)
    const handleDragStart = (e, index, isCurrentImage) => {
        setDraggedItem({ index, isCurrentImage: false }); // 在新文章中，所有圖片都是新上傳的
        e.dataTransfer.effectAllowed = 'move';
        const dragImage = new Image();
        dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(dragImage, 0, 0);
    };

    // 處理拖拽結束 (為了與 ImagePreviewList 組件兼容)
    const handleDragEnd = () => {
        if (!draggedItem || !draggedOverItem) {
            setDraggedItem(null);
            setDraggedOverItem(null);
            return;
        }

        const { index: draggedIndex } = draggedItem;
        const { index: draggedOverIndex } = draggedOverItem;

        // 移動圖片和預覽
        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(draggedOverIndex, 0, draggedImage);
        setImages(newImages);

        const newPreviews = [...imagePreviews];
        const draggedPreview = newPreviews[draggedIndex];
        newPreviews.splice(draggedIndex, 1);
        newPreviews.splice(draggedOverIndex, 0, draggedPreview);
        setImagePreviews(newPreviews);

        setDraggedItem(null);
        setDraggedOverItem(null);
    };

    // 處理拖拽進入 (為了與 ImagePreviewList 組件兼容)
    const handleDragOver = (e, index, isCurrentImage) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggedItem && draggedItem.index === index && !isCurrentImage) {
            return;
        }
        
        setDraggedOverItem({ index, isCurrentImage: false });
    };

    // 處理表單提交的函數
    const handleSubmit = async (e) => {
        e.preventDefault();
        // 只驗證分類
        if (!category) {
            setError('請選擇一個分類');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 上傳所有圖片並獲取URLs
            const imageUrls = [];
            if (images.length > 0) {
                // 並行上傳所有圖片
                const uploadPromises = images.map(image => uploadImageToR2(image, r2Client));
                const urls = await Promise.all(uploadPromises);
                imageUrls.push(...urls);
            }

            // 獲取 Firestore 實例
            const postsRef = collection(db, 'posts');
            
            // 創建新文章文檔，標題和內容可為空
            const postData = {
                imageUrls: imageUrls, // 使用圖片URL數組
                title: title.trim() || '',
                content: content.replace(/\n/g, '\n') || '',
                category: category, 
                createdAt: serverTimestamp(),
                author: {
                    displayName: auth.currentUser.displayName || '匿名用戶',
                    photoURL: auth.currentUser.photoURL || null,
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email
                }
            };

            await addDoc(postsRef, postData);

            // 發布成功後導航到首頁
            navigate('/');
        } catch (error) {
            console.error('發文失敗:', error);
            setError('發文失敗，請稍後再試');
            setLoading(false);
        }
    };

    // 使用 useEffect 在組件加載時獲取分類
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                const topicsRef = collection(db, 'topics');
                const topicsSnapshot = await getDocs(topicsRef);
                
                const fetchedCategories = [];
                topicsSnapshot.forEach((doc) => {
                    fetchedCategories.push({
                        id: doc.id,
                        name: doc.data().name || doc.id // 如果沒有名稱，使用 id
                    });
                });

                // 按照名稱排序分類
                fetchedCategories.sort((a, b) => a.name.localeCompare(b.name));
                setCategories(fetchedCategories);
            } catch (error) {
                console.error('獲取分類失敗:', error);
                setError('無法載入分類，請稍後再試');
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []); // 空依賴數組意味著這個效果只在組件掛載時運行一次

    // 使用 Framer Motion 創建動畫效果的容器
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto p-4"
        >
            {/* 返回按鈕 */}
            <BackButton navigate={navigate} />
            
            {/* 頁面標題 */}
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">發表新文章</h1>
            
            {/* 圖片上傳區域 */}
            <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    上傳圖片(可選，最多20張)
                </label>
                
                <ImageUploader 
                    onDragOver={handleFileDragOver}
                    onDrop={handleDrop}
                    onChange={handleImagesChange}
                    isDisabled={loading || images.length >= 20}
                />
                
                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                
                {/* 圖片預覽區域 */}
                {imagePreviews.length > 0 && (
                    <ImagePreviewList 
                        currentImages={[]} // 新文章沒有現有圖片
                        images={images}
                        imagePreviews={imagePreviews}
                        draggedOverItem={draggedOverItem}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onRemoveCurrentImage={() => {}} // 新文章沒有現有圖片，所以這個函數不會被調用
                        onRemoveNewImage={handleRemoveImage}
                    />
                )}
                
                {/* 拖拽提示 */}
                {imagePreviews.length > 1 && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        提示：您可以拖拽圖片來調整順序
                    </p>
                )}
            </div>
            
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
                onCancel={() => navigate('/')}
                isUploading={loading}
            />
            
            <ScrollToTopButton />
        </motion.div>
    );
}