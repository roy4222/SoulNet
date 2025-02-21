// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import firebase, { r2Client } from '../utils/firebase';

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
    const [category, setCategory] = useState('life');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    
    // 使用 useNavigate 鉤子來進行路由導航
    const navigate = useNavigate();
    
    // 獲取 Firebase 身份驗證實例
    const auth = getAuth();

    // 儲存分類選項的狀態
    const [categories, setCategories] = useState([]);

    // 使用 useEffect 鉤子在組件加載時獲取分類選項
    useEffect(() => {
        // 定義異步函數以獲取分類
        const fetchCategories = async () => {
            // 獲取 Firestore 實例
            const db = getFirestore(firebase);
            // 創建對 'topics' 集合的引用
            const topicsRef = collection(db, 'topics');
            // 獲取 'topics' 集合的所有文檔
            const topicsSnapshot = await getDocs(topicsRef);
            
            // 初始化一個空數組來存儲獲取的分類
            const fetchedCategories = [];
            // 遍歷查詢結果
            topicsSnapshot.forEach((doc) => {
                // 將每個文檔的 id 和名稱添加到數組中
                fetchedCategories.push({
                    id: doc.id,
                    name: doc.data().name || doc.id // 如果沒有名稱，則使用 id
                });
            });

            // 更新分類狀態
            setCategories(fetchedCategories);
            // 如果獲取到分類，將默認分類設置為第一個
            if (fetchedCategories.length > 0) {
                setCategory(fetchedCategories[0].id);
            }
        };

        // 調用獲取分類的函數
        fetchCategories();
    }, []); // 空依賴數組意味著這個效果只在組件掛載時運行一次

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
        // 驗證表單輸入
        if (!title.trim() || !content.trim()) {
            setError('標題和內容不能為空');
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
            const db = getFirestore(firebase);
            const postsRef = collection(db, 'posts');
            
            // 創建新文章文檔
            const postData = {
                imageUrl: imageUrl || '',
                title: title.trim(),
                content: content.replace(/\n/g, '\n'),
                category: category, // 使用category而不是topic
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

    // 使用 Framer Motion 創建動畫效果的容器
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto p-4"
        >
            {/* 頁面標題 */}
            <h1 className="text-3xl font-bold mb-6">發表新文章</h1>
            
            {/* 表單開始 */}
            <form onSubmit={handleSubmit} className="space-y-4">
                 {/* 圖片上傳區域 */}
                 <div className="mb-6">
                    <label htmlFor="image" className="block text-lg font-semibold text-gray-800 mb-2">
                        上傳圖片(可選)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      {/* 圖片上傳標籤，根據是否有預覽圖改變樣式 */}
                      <label htmlFor="image" className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer ${imagePreview ? 'bg-cover bg-center' : 'bg-gray-50 hover:bg-gray-100'}`} style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : {}}>
                        {/* 當沒有預覽圖時顯示上傳提示 */}
                        {!imagePreview && (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {/* 上傳圖標 */}
                            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            {/* 上傳提示文字 */}
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">點擊上傳</span> 或拖放</p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF (最大 5MB)</p>
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
                </div>
                {/* 標題、內容和分類輸入區域 */}
                <div className="space-y-6">
                    {/* 標題輸入 */}
                    <div>
                        <label htmlFor="title" className="block text-lg font-semibold text-gray-800 mb-2">標題</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            placeholder="請輸入吸引人的標題"
                        />
                    </div>

                    {/* 內容輸入區域 */}
                    <div>
                        {/* 內容標籤 */}
                        <label htmlFor="content" className="block text-lg font-semibold text-gray-800 mb-2">內容</label>
                        {/* 多行文本輸入框 */}
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="8"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            style={{
                                whiteSpace: 'pre-wrap',     // 保留換行和空格
                                wordWrap: 'break-word',     // 允許長單詞換行
                                overflowWrap: 'break-word'  // 確保內容不會溢出容器
                            }}
                            placeholder="分享你的想法..."
                        />
                    </div>

                    {/* 分類選擇 */}
                    <div>
                        <label htmlFor="category" className="block text-lg font-semibold text-gray-800 mb-2">分類</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-white"
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 錯誤訊息顯示 */}
                {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                )}

                {/* 提交按鈕 */}
                <div className="flex justify-end mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition duration-300 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                {/* 載入中的動畫圖標 */}
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                發布中...
                            </span>
                        ) : '發布文章'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}