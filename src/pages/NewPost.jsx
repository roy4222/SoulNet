// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import firebase from '../utils/firebase';

// 定義 NewPost 組件
export default function NewPost() {
    // 使用 useState 鉤子來管理表單狀態
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('life');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // 使用 useNavigate 鉤子來進行路由導航
    const navigate = useNavigate();
    
    // 獲取 Firebase 身份驗證實例
    const auth = getAuth();

    // 儲存分類選項的狀態
    const [categories, setCategories] = useState([]);
    // 新增主題對話框的狀態
    const [showTopicDialog, setShowTopicDialog] = useState(false);
    const [newTopicId, setNewTopicId] = useState('');
    const [newTopicName, setNewTopicName] = useState('');
    const [topicError, setTopicError] = useState('');

    // 從 Firestore 獲取分類選項
    useEffect(() => {
        const fetchCategories = async () => {
            const db = getFirestore(firebase);
            const topicsRef = collection(db, 'topics');
            const topicsSnapshot = await getDocs(topicsRef);
            
            const fetchedCategories = [];
            topicsSnapshot.forEach((doc) => {
                fetchedCategories.push({
                    value: doc.id,
                    label: doc.data().name || doc.id
                });
            });

            // 如果沒有 'other' 分類，則新增一個（使用固定的文檔ID）
            const otherDocRef = doc(db, 'topics', 'other');
            const otherDoc = await getDoc(otherDocRef);
            
            if (!otherDoc.exists()) {
                await setDoc(otherDocRef, {
                    name: '其他',
                    createdAt: serverTimestamp()
                });
                fetchedCategories.push({ value: 'other', label: '其他' });
            } else if (!fetchedCategories.some(cat => cat.value === 'other')) {
                fetchedCategories.push({ value: 'other', label: '其他' });
            }

            setCategories(fetchedCategories);
        };

        fetchCategories().catch(console.error);
    }, []);

    // 使用 useEffect 鉤子來檢查用戶登入狀態
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        // 監聽身份驗證狀態變化
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthChecked(true);
            if (!user) {
                // 如果用戶未登入，則導航到登入頁面
                navigate('/sign');
            }
        });

        // 清理訂閱
        return () => unsubscribe();
    }, [navigate]);

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
            // 獲取 Firestore 實例
            const db = getFirestore(firebase);
            const postsRef = collection(db, 'posts');
            
            // 創建新文章文檔
            await addDoc(postsRef, {
                title: title.trim(),
                content: content.trim(),
                category: category,
                author: auth.currentUser.displayName || auth.currentUser.email,
                authorId: auth.currentUser.uid,
                date: new Date().toISOString().split('T')[0],
                likes: 0,
                comments: [],
                createdAt: serverTimestamp()
            });

            // 發布成功後導航到首頁
            navigate('/');
        } catch (err) {
            setError('發布文章時出現錯誤，請稍後再試');
            console.error('Error creating post:', err);
        } finally {
            setLoading(false);
        }
    };

    // 渲染組件
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto p-4 mt-8"
        >
            <h1 className="text-3xl font-bold mb-6 text-gray-800">發表新文章</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 顯示錯誤信息 */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                
                <div className="space-y-4">
                    {/* 標題輸入框 */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            標題
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="請輸入文章標題"
                            disabled={loading}
                        />
                    </div>

                    {/* 分類選擇框 */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            分類
                        </label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => {
                                const value = e.target.value;
                                setCategory(value);
                                if (value === 'other') {
                                    setShowTopicDialog(true);
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            {categories.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 內容輸入框 */}
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                        內容
                    </label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="請輸入文章內容"
                        disabled={loading}
                    />
                </div>

                {/* 按鈕組 */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        disabled={loading}
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                        disabled={loading}
                    >
                        {loading ? '發布中...' : '發布文章'}
                    </button>
                </div>
            </form>

            {/* 新增主題對話框 */}
            {showTopicDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">新增主題</h2>
                        
                        {topicError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {topicError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="topicId" className="block text-sm font-medium text-gray-700 mb-1">
                                    主題 ID
                                </label>
                                <input
                                    type="text"
                                    id="topicId"
                                    value={newTopicId}
                                    onChange={(e) => setNewTopicId(e.target.value.toLowerCase())}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="請輸入主題 ID（小寫英文）"
                                />
                            </div>

                            <div>
                                <label htmlFor="topicName" className="block text-sm font-medium text-gray-700 mb-1">
                                    主題名稱
                                </label>
                                <input
                                    type="text"
                                    id="topicName"
                                    value={newTopicName}
                                    onChange={(e) => setNewTopicName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="請輸入主題名稱"
                                />
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTopicDialog(false);
                                        setCategory('life');
                                        setNewTopicId('');
                                        setNewTopicName('');
                                        setTopicError('');
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!newTopicId.trim() || !newTopicName.trim()) {
                                            setTopicError('請填寫所有欄位');
                                            return;
                                        }

                                        if (!/^[a-z0-9-]+$/.test(newTopicId)) {
                                            setTopicError('ID 只能包含小寫英文、數字和線條');
                                            return;
                                        }

                                        try {
                                            const db = getFirestore(firebase);
                                            const newTopicRef = doc(db, 'topics', newTopicId);
                                            const topicDoc = await getDoc(newTopicRef);

                                            if (topicDoc.exists()) {
                                                setTopicError('此 ID 已存在');
                                                return;
                                            }

                                            await setDoc(newTopicRef, {
                                                name: newTopicName,
                                                createdAt: serverTimestamp()
                                            });

                                            setCategories(prev => [...prev, { value: newTopicId, label: newTopicName }]);
                                            setCategory(newTopicId);
                                            setShowTopicDialog(false);
                                            setNewTopicId('');
                                            setNewTopicName('');
                                            setTopicError('');
                                        } catch (err) {
                                            console.error('Error creating topic:', err);
                                            setTopicError('創建主題時發生錯誤');
                                        }
                                    }}
                                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    確認
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}