// 引入必要的庫和組件
import { motion } from 'framer-motion'; // 引入 framer-motion 動畫庫
import { useState, useEffect } from 'react'; // 引入 React Hooks
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'; // 引入 Firestore 相關函數
import { db } from '../../utils/firebase'; // 引入 Firebase 配置

/**
 * SearchSuggestions 組件 - 顯示搜尋建議和歷史記錄
 * @param {Object} props 組件屬性
 * @param {Array} props.suggestions - 搜尋建議列表
 * @param {string} props.searchQuery - 當前搜尋關鍵字
 * @param {Array} props.searchHistory - 搜尋歷史記錄
 * @param {boolean} props.showSuggestions - 控制建議框顯示狀態
 * @param {Function} props.onSuggestionClick - 點擊建議項目的處理函數
 * @param {Function} props.onClearHistory - 清除所有歷史記錄的處理函數
 * @param {Function} props.onRemoveHistoryItem - 移除單個歷史記錄的處理函數
 */
export default function SearchSuggestions({ 
    suggestions,
    searchQuery,
    searchHistory,
    showSuggestions,
    onSuggestionClick,
    onClearHistory,
    onRemoveHistoryItem
}) {
    // 文章建議列表狀態
    const [postSuggestions, setPostSuggestions] = useState([]);

    // 監聽搜尋關鍵字變化，從 Firestore 獲取文章建議
    useEffect(() => {
        const fetchPostSuggestions = async () => {
            // 如果搜尋關鍵字為空，清空建議列表並返回
            if (!searchQuery.trim()) {
                setPostSuggestions([]);
                return;
            }

            try {
                // 轉換搜尋關鍵字為小寫
                const searchTerm = searchQuery.trim().toLowerCase();
                const postsRef = collection(db, 'posts');
                
                // 建立 Firestore 查詢
                const postsQuery = query(
                    postsRef,
                    orderBy('createdAt', 'desc'), // 按創建時間降序排序
                    limit(10) // 限制返回 10 條記錄
                );

                // 執行查詢
                const querySnapshot = await getDocs(postsQuery);
                const posts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // 在記憶體中進行過濾和排序
                const filteredPosts = posts.filter(post => {
                    // 檢查標題、內容、分類和作者是否包含搜尋關鍵字
                    const titleMatch = post.title?.toLowerCase().includes(searchTerm);
                    const contentMatch = post.content?.toLowerCase().includes(searchTerm);
                    const categoryMatch = post.category?.toLowerCase().includes(searchTerm);
                    const authorMatch = post.author?.displayName?.toLowerCase().includes(searchTerm);
                    
                    return titleMatch || contentMatch || categoryMatch || authorMatch;
                }).map(post => {
                    // 確定匹配類型
                    const matchTypes = [];
                    if (post.title?.toLowerCase().includes(searchTerm)) matchTypes.push('title');
                    if (post.content?.toLowerCase().includes(searchTerm)) matchTypes.push('content');
                    if (post.category?.toLowerCase().includes(searchTerm)) matchTypes.push('category');
                    if (post.author?.displayName?.toLowerCase().includes(searchTerm)) matchTypes.push('author');

                    // 找出內容中匹配的上下文
                    let contentPreview = '';
                    if (post.content) {
                        const index = post.content.toLowerCase().indexOf(searchTerm);
                        if (index !== -1) {
                            // 提取匹配關鍵字前後 30 個字符作為預覽
                            const start = Math.max(0, index - 30);
                            const end = Math.min(post.content.length, index + searchTerm.length + 30);
                            contentPreview = post.content.substring(start, end);
                            // 添加省略號表示截斷
                            if (start > 0) contentPreview = '...' + contentPreview;
                            if (end < post.content.length) contentPreview = contentPreview + '...';
                        }
                    }

                    return {
                        ...post,
                        matchTypes,
                        contentPreview
                    };
                });

                // 根據匹配類型進行排序
                filteredPosts.sort((a, b) => {
                    // 標題匹配優先
                    if (a.matchTypes.includes('title') && !b.matchTypes.includes('title')) return -1;
                    if (!a.matchTypes.includes('title') && b.matchTypes.includes('title')) return 1;
                    // 其次是作者名稱匹配
                    if (a.matchTypes.includes('author') && !b.matchTypes.includes('author')) return -1;
                    if (!a.matchTypes.includes('author') && b.matchTypes.includes('author')) return 1;
                    // 再次是分類匹配
                    if (a.matchTypes.includes('category') && !b.matchTypes.includes('category')) return -1;
                    if (!a.matchTypes.includes('category') && b.matchTypes.includes('category')) return 1;
                    // 最後是內容匹配
                    return 0;
                });

                // 只取前 5 條記錄
                setPostSuggestions(filteredPosts.slice(0, 5));
            } catch (error) {
                console.error('獲取文章建議時出錯:', error);
                setPostSuggestions([]);
            }
        };

        // 當有搜尋關鍵字時執行查詢
        if (searchQuery.trim()) {
            fetchPostSuggestions();
        } else {
            setPostSuggestions([]);
        }
    }, [searchQuery]);

    // 如果不顯示建議框，或沒有搜尋關鍵字且歷史記錄為空，則不渲染任何內容
    if (!showSuggestions || (!searchQuery.trim() && searchHistory.length === 0)) {
        return null;
    }

    /**
     * 高亮顯示匹配的文本
     * @param {string} text - 原始文本
     * @param {string} searchTerm - 搜尋關鍵字
     * @returns {Array|string} 高亮處理後的文本
     */
    const highlightMatch = (text, searchTerm) => {
        if (!text || !searchTerm.trim()) return text || '';
        const regex = new RegExp(`(${searchTerm.trim()})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) => 
            regex.test(part) ? 
                <span key={i} className="bg-yellow-200 dark:bg-yellow-900">{part}</span> : 
                part
        );
    };

    /**
     * 格式化時間戳為本地時間字符串
     * @param {Object} timestamp - Firebase 時間戳
     * @returns {string} 格式化後的時間字符串
     */
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        // 使用 framer-motion 為建議框添加動畫效果
        <motion.div
            initial={{ opacity: 0, y: -10 }} // 初始狀態
            animate={{ opacity: 1, y: 0 }} // 動畫狀態
            exit={{ opacity: 0, y: -10 }} // 退出狀態
            className="absolute w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 overflow-hidden z-50"
        >
            {searchQuery.trim() ? (
                <>
                    {/* 文章建議區塊 */}
                    {postSuggestions.length > 0 && (
                        <div className="border-b dark:border-gray-700">
                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                                相關文章
                            </div>
                            {postSuggestions.map((post) => (
                                <div
                                    key={post.id}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center space-x-2 cursor-pointer"
                                    onClick={() => onSuggestionClick(post.title)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <svg className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {post.title ? (
                                                highlightMatch(post.title, searchQuery)
                                            ) : (
                                                <span className="text-gray-400">無標題</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1 flex-wrap">
                                            <span>{post.author?.displayName || '匿名用戶'}</span>
                                            <span>·</span>
                                            <span>{post.category || '未分類'}</span>
                                            <span>·</span>
                                            <span>{formatDate(post.createdAt)}</span>
                                            <span>·</span>
                                            <span className="text-blue-500 dark:text-blue-400">
                                                {post.matchTypes.map(type => {
                                                    switch(type) {
                                                        case 'title': return '標題符合';
                                                        case 'content': return '內文符合';
                                                        case 'category': return '分類符合';
                                                        case 'author': return '作者符合';
                                                        default: return '';
                                                    }
                                                }).join('、')}
                                            </span>
                                        </div>
                                        {post.contentPreview && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                                {highlightMatch(post.contentPreview, searchQuery)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 搜尋建議區塊 */}
                    {suggestions.length > 0 && (
                        <div className={postSuggestions.length > 0 ? 'border-t dark:border-gray-700' : ''}>
                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                                搜尋記錄
                            </div>
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center space-x-2 cursor-pointer"
                                    onClick={() => onSuggestionClick(suggestion)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{suggestion}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 無結果提示 */}
                    {postSuggestions.length === 0 && suggestions.length === 0 && (
                        <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            沒有找到相關搜尋結果
                        </div>
                    )}
                </>
            ) : searchHistory.length > 0 ? (
                // 當沒有搜尋關鍵字但有歷史記錄時，顯示歷史記錄
                <>
                    {/* 歷史記錄標題欄 */}
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 flex justify-between items-center">
                        <span>搜尋紀錄</span>
                        <button
                            type="button"
                            onClick={onClearHistory}
                            className="text-red-500 hover:text-red-600 text-xs"
                        >
                            清除全部
                        </button>
                    </div>
                    {/* 歷史記錄列表 */}
                    {searchHistory.map((item, index) => (
                        <div
                            key={index}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-between group cursor-pointer"
                            onClick={() => onSuggestionClick(item)}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex items-center space-x-2">
                                {/* 時鐘圖標 */}
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{item}</span>
                            </div>
                            {/* 刪除單個歷史記錄的按鈕 */}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation(); // 防止事件冒泡
                                    onRemoveHistoryItem(index);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 cursor-pointer"
                                role="button"
                                tabIndex={0}
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </>
            ) : null}
        </motion.div>
    );
} 