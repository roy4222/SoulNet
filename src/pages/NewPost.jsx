// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import firebase, { r2Client } from '../utils/firebase';
import ScrollToTopButton from '../components/ScrollToTopButton';

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

// 定義 NewPost 組件
export default function NewPost() {
    // 使用 useState 鉤子來管理表單狀態
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState(''); // 初始值設為空字串
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [categories, setCategories] = useState([]); // 存儲分類列表
    const [loadingCategories, setLoadingCategories] = useState(true); // 添加加載狀態
    
    // 使用 useNavigate 鉤子來進行路由導航
    const navigate = useNavigate();
    
    // 獲取 Firebase 身份驗證實例
    const auth = getAuth();
    const db = getFirestore();

    // 處理拖放事件
    // 阻止默認行為並停止事件傳播
    const handleDragOver = (e) => {
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
        // 如果有檔案，則調用handleImageChange處理
        if (files && files[0]) {
            handleImageChange({ target: { files: [files[0]] } });
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
                // 獲取檔案並調用handleImageChange處理
                const file = item.getAsFile();
                handleImageChange({ target: { files: [file] } });
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
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB限制
                setError('圖片大小不能超過5MB');
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // 上傳圖片到R2
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
            let imageUrl = '';
            if (image) {
                imageUrl = await uploadImageToR2(image);
            }

            // 獲取 Firestore 實例
            const postsRef = collection(db, 'posts');
            
            // 創建新文章文檔，標題和內容可為空
            const postData = {
                imageUrl: imageUrl || '',
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
            {/* 頁面標題 */}
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">發表新文章</h1>
            
            {/* 表單開始 */}
            <form onSubmit={handleSubmit} className="space-y-4">
                 {/* 圖片上傳區域 */}
                 <div className="mb-6">
                    <label htmlFor="image" className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        上傳圖片(可選)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      {/* 圖片上傳標籤，根據是否有預覽圖改變樣式 */}
                      <label 
                        htmlFor="image" 
                        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer ${imagePreview ? 'bg-cover bg-center' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`} 
                        style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : {}}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        {/* 當沒有預覽圖時顯示上傳提示 */}
                        {!imagePreview && (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {/* 上傳圖標 */}
                            <svg className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            {/* 上傳提示文字 */}
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">點擊上傳</span> 或拖放圖片
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF (最大 5MB)</p>
                          </div>
                        )}
                        {/* 隱藏的文件輸入框 */}
                        <input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={loading}
                        />
                      </label>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>

                {/* 標題輸入框 */}
                <div>
                    <label htmlFor="title" className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        標題 (可選)
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="想說些什麼嗎？（可選）"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* 分類選擇 */}
                <div>
                    <label htmlFor="category" className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        分類 <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        required
                        disabled={loadingCategories} // 在加載時禁用選擇
                    >
                        <option value="" disabled>
                            {loadingCategories ? '載入中...' : '請選擇主題'}
                        </option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id} className="text-gray-900 dark:text-gray-100">
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>

                {/* 內容輸入框 */}
                <div>
                    <label htmlFor="content" className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        內容 (可選)
                    </label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="分享你的想法...（可選）"
                        rows="6"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* 提交按鈕 */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? '發布中...' : '發布文章'}
                    </button>
                </div>
            </form>
            <ScrollToTopButton />
        </motion.div>
    );
}