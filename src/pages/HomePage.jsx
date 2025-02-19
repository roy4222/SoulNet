import React, { useState } from 'react';
import { motion } from 'framer-motion';

// 定義文章分類
const categories = [
  { id: 'all', name: '全部' },
  { id: 'life', name: '生活' },
  { id: 'tech', name: '科技' },
  { id: 'food', name: '美食' },
  { id: 'travel', name: '旅遊' }
];

// 模擬文章數據
const dummyPosts = [
  {
    id: 1,
    title: '今天的晚餐：香濃奶油蘑菇義大利麵',
    category: 'food',
    content: '今晚我嘗試了一道經典的奶油蘑菇義大利麵。新鮮的蘑菇搭配香濃的奶油醬汁，口感豐富又滑順。我用了混合的蘑菇品種，包括香菇、杏鮑菇和白蘑菇，增添了豐富的層次感。麵條選用了al dente口感的寬麵，每一口都充滿彈性。最後撒上些許帕瑪森起司和新鮮荷蘭芹，完美提升了整體風味。這道料理不僅美味，製作過程也相當療癒。',
    author: '美食達人',
    date: '2023-05-15',
    likes: 128,
    comments: 32
  },
  {
    id: 2,
    title: 'React 18新特性深度解析：並發渲染與自動批處理',
    category: 'tech',
    content: 'React 18帶來了令人興奮的新特性，其中最引人注目的是並發渲染（Concurrent Rendering）和自動批處理（Automatic Batching）。並發渲染允許React中斷長時間運行的渲染任務，優先處理更緊急的更新，從而提高應用的響應性。自動批處理則可以將多個狀態更新合併為單個重新渲染，顯著提升性能。本文將深入探討這些特性的實現原理、使用方法以及對現有React應用的影響。同時，我們還會討論新的Suspense SSR架構和過渡API（Transition API）等其他重要更新。',
    author: '前端專家',
    date: '2023-05-14',
    likes: 256,
    comments: 54
  },
  {
    id: 3,
    title: '九份老街：穿越時空的山城之旅',
    category: 'travel',
    content: '這個週末，我踏上了前往九份的旅程。這座位於台灣東北部的山城，以其獨特的歷史風貌和迷人的山海景色聞名。漫步在蜿蜒的老街上，古色古香的建築和紅燈籠營造出濃厚的復古氛圍。我品嚐了著名的芋圓和魚丸，在階梯街道間穿梭，彷彿回到了昔日繁華的礦業時代。傍晚時分，站在觀景台眺望基隆山和太平洋，夕陽餘暉灑落，景色壯麗動人。九份不僅是一個觀光勝地，更是一次穿越時空的文化之旅。',
    author: '旅行愛好者',
    date: '2023-05-13',
    likes: 189,
    comments: 41
  },
  {
    id: 4,
    title: '打造溫馨舒適的居家空間：5個實用布置技巧',
    category: 'life',
    content: '居家生活品質直接影響我們的心情和生活質量。今天我要分享5個簡單却效果顯著的家居布置技巧：1. 善用自然光線，選擇適當的窗簾來調節室內光線；2. 加入綠植元素，不僅美化環境，還能淨化空氣；3. 選擇多功能家具，既實用又能節省空間；4. 運用軟裝飾品如抱枕、地毯來增添溫馨感；5. 保持整潔有序，定期進行斷捨離。這些小技巧不需要大筆投資，却能顯著提升居家舒適度和幸福感。讓我們一起營造一個溫馨愜意的生活空間吧！',
    author: '生活家',
    date: '2023-05-12',
    likes: 215,
    comments: 67
  },
  {
    id: 5,
    title: '智能家居革命：打造未來生活空間',
    category: 'tech',
    content: '智能家居技術正在迅速改變我們的生活方式。從智能燈泡到語音控制的家電，這些創新產品不僅為我們帶來便利，還能提高能源效率。本文將探討最新的智能家居趨勢，包括AI助手的應用、物聯網設備的互連性，以及如何在保護隱私的同時享受科技帶來的便利。我們還將分享一些實用的智能家居配置建議，幫助你輕鬆開啟智能生活。',
    author: '科技達人',
    date: '2023-05-11',
    likes: 178,
    comments: 45
  },
  {
    id: 6,
    title: '台灣小吃之旅：夜市美食大搜羅',
    category: 'food',
    content: '台灣的夜市文化聞名世界，是體驗地道美食的最佳去處。本次美食之旅，我走訪了多個知名夜市，品嚐了各式各樣的台灣小吃。從香脆可口的蚵仔煎到香濃滑嫩的臭豆腐，每一種食物都有其獨特的魅力。特別推薦的還有珍珠奶茶、胡椒餅和鹽酥雞。這不僅是一次味蕾的盛宴，更是對台灣飲食文化的深度探索。跟著我的腳步，一起感受台灣夜市的熱鬧氛圍和美食魅力吧！',
    author: '美食家',
    date: '2023-05-10',
    likes: 202,
    comments: 58
  },
  {
    id: 7,
    title: '居家工作的效率秘訣：如何平衡工作與生活',
    category: 'life',
    content: '隨著遠程工作成為新常態，許多人面臨著如何在家中保持高效率的挑戰。本文將分享一些實用的居家工作技巧，包括如何設置一個專業的家庭辦公環境、制定有效的時間管理策略、保持工作與生活的界限等。我們還將探討如何克服居家工作常見的困擾，如孤獨感和缺乏動力。通過這些建議，你將能夠在享受居家工作彈性的同時，保持高效率和良好的生活品質。',
    author: '職場顧問',
    date: '2023-05-09',
    likes: 165,
    comments: 39
  }

];

// 定義HomePage組件
const HomePage = () => {
  // 狀態管理
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState(dummyPosts);

  // 根據分類過濾文章
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* 使用條件式 grid 布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4 lg:gap-8">
          {/* 分類導航 - 在手機版時水平滾動 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-4 lg:h-fit order-2 lg:order-1"
          >
            <h2 className="text-lg font-semibold mb-4 px-2 lg:block hidden">文章分類</h2>
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 lg:mx-0 px-4 lg:px-0">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-left transition-all whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </nav>
          </motion.div>

          {/* 右側內容區 */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* 歡迎區塊 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-4 sm:mb-8"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                歡迎來到社交平台
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600">
                連結朋友，分享生活，探索世界
              </p>
            </motion.div>

            {/* 文章列表區域 */}
            <div className="grid gap-4 sm:gap-6">
              {filteredPosts.map(post => (
                <motion.article
                  key={post.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white p-4 sm:p-6 rounded-xl shadow-md"
                >
                  {/* 文章標題 */}
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">{post.title}</h2>
                  {/* 文章分類和日期 */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-4">
                    {/* 分類標籤 */}
                    <span className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                      {categories.find(c => c.id === post.category)?.name}
                    </span>
                    {/* 發布日期 */}
                    <span className="text-sm text-gray-500">{post.date}</span>
                  </div>
                  {/* 文章內容 */}
                  <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">{post.content}</p>
                  {/* 點讚和留言數量 */}
                  <div className="flex items-center justify-between text-gray-500 text-sm sm:text-base">
                    {/* 點讚數量 */}
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      <span>{post.likes} 個讚</span>
                    </div>
                    {/* 留言數量 */}
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span>{post.comments} 則留言</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;