// 引入必要的依賴
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ROUTES } from '../../routes';
import { AnimatePresence } from 'framer-motion';
import { debounce } from './utils';
import { SEARCH_HISTORY_KEY, MAX_HISTORY_ITEMS } from './constants';
import SearchSuggestions from './SearchSuggestions';

// SearchBar 組件：實現搜尋功能的主要組件
export default function SearchBar() {
    const navigate = useNavigate(); // 用於頁面導航
    const [searchQuery, setSearchQuery] = useState(''); // 搜尋關鍵字狀態
    const [isLoading, setIsLoading] = useState(false); // 載入狀態
    const [showSuggestions, setShowSuggestions] = useState(false); // 控制搜尋建議的顯示
    const [searchHistory, setSearchHistory] = useState(() => {
        // 初始化時從 localStorage 讀取搜尋歷史
        const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [suggestions, setSuggestions] = useState([]); // 搜尋建議列表
    const inputRef = useRef(null); // 搜尋輸入框的引用
    const suggestionsRef = useRef(null); // 搜尋建議框的引用

    // 將搜尋記錄保存到歷史記錄中
    const saveToHistory = (query) => {
        const newHistory = [
            query,
            ...searchHistory.filter(item => item !== query)
        ].slice(0, MAX_HISTORY_ITEMS);
        setSearchHistory(newHistory);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    };

    // 處理搜尋提交
    const handleSearch = async (e) => {
        e?.preventDefault();
        if (searchQuery.trim()) {
            setIsLoading(true);
            try {
                saveToHistory(searchQuery.trim());
                navigate(`${ROUTES.HOME}?search=${encodeURIComponent(searchQuery.trim())}`);
            } finally {
                setIsLoading(false);
                setShowSuggestions(false);
            }
        }
    };

    // 獲取搜尋建議的防抖函數
    const fetchSuggestions = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                setSuggestions([]);
                return;
            }
            // 從歷史記錄中過濾匹配的建議
            const filteredHistory = searchHistory.filter(
                item => item.toLowerCase().includes(query.toLowerCase())
            );
            setSuggestions(filteredHistory);
        }, 300),
        [searchHistory]
    );

    // 當搜尋關鍵字變化時更新建議
    useEffect(() => {
        fetchSuggestions(searchQuery);
    }, [searchQuery, fetchSuggestions]);

    // 點擊外部時關閉建議框
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 按下 ESC 鍵時清空搜尋並關閉建議框
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSearchQuery('');
                setShowSuggestions(false);
                inputRef.current?.blur();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 清除所有搜尋歷史
    const handleClearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    };

    // 移除特定的歷史記錄項目
    const handleRemoveHistoryItem = (index) => {
        const newHistory = searchHistory.filter((_, i) => i !== index);
        setSearchHistory(newHistory);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    };

    return (
        <div className="relative w-full" ref={suggestionsRef}>
            <form onSubmit={handleSearch} className="relative">
                <input 
                    ref={inputRef}
                    type="text" 
                    className="w-full border rounded-full py-2 px-4 pr-12 text-gray-900 leading-tight focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200" 
                    placeholder="搜尋..." 
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                />
                {/* 搜尋按鈕 */}
                <button 
                    type="submit"
                    className="absolute right-0 top-0 mt-2 mr-4 transition-transform duration-200 hover:scale-110"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        // 載入中的動畫圖示
                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        // 搜尋圖示
                        <svg 
                            className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </button>
            </form>

            {/* 搜尋建議列表 */}
            <AnimatePresence>
                <SearchSuggestions
                    suggestions={suggestions}
                    searchQuery={searchQuery}
                    searchHistory={searchHistory}
                    showSuggestions={showSuggestions}
                    onSuggestionClick={(suggestion) => {
                        setSearchQuery(suggestion);
                        handleSearch();
                    }}
                    onClearHistory={handleClearHistory}
                    onRemoveHistoryItem={handleRemoveHistoryItem}
                />
            </AnimatePresence>
        </div>
    );
} 