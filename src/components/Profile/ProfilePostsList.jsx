import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Grid, Card, CardContent, Typography, Box, Button } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import RepeatIcon from '@mui/icons-material/Repeat';
import { db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '@mui/material/styles';

// ProfilePostsList 組件：顯示用戶的原創文章和轉發文章列表
function ProfilePostsList({ posts, reposts, activeTab, navigate }) {
  const [expandedPosts, setExpandedPosts] = useState({});
  const [originalPosts, setOriginalPosts] = useState({});
  const theme = useTheme();

  // 輸出調試信息
  useEffect(() => {
    console.log('ProfilePostsList - 接收到的原創文章:', posts);
    console.log('ProfilePostsList - 接收到的轉發文章:', reposts);
    console.log('ProfilePostsList - 當前活動標籤:', activeTab);
  }, [posts, reposts, activeTab]);

  // 切換文章展開狀態
  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // 獲取原始文章資訊
  useEffect(() => {
    // 只在活動標籤為轉發(1)且有轉發文章時執行
    if (activeTab === 1 && reposts.length > 0) {
      const fetchOriginalPosts = async () => {
        const originalPostsData = {};
        
        // 遍歷所有轉發文章
        for (const repost of reposts) {
          // 檢查是否有原始文章ID
          if (repost.originalPostId) {
            try {
              // 從數據庫獲取原始文章
              const originalPostDoc = await getDoc(doc(db, 'posts', repost.originalPostId));
              // 如果原始文章存在，將其添加到originalPostsData對象中
              if (originalPostDoc.exists()) {
                originalPostsData[repost.originalPostId] = {
                  ...originalPostDoc.data(),
                  id: originalPostDoc.id
                };
              }
            } catch (error) {
              console.error('獲取原始文章時發生錯誤:', error);
            }
          }
        }
        
        // 更新原始文章狀態
        setOriginalPosts(originalPostsData);
      };
      
      // 執行獲取原始文章的函數
      fetchOriginalPosts();
    }
  }, [activeTab, reposts]); // 依賴於activeTab和reposts的變化

  // 渲染文章卡片
  const renderPostCard = (post, isRepost = false) => {
    // 確保 post 物件存在且有效
    if (!post) {
      console.log('renderPostCard: post 物件為空');
      return null;
    }
    
    console.log('渲染文章卡片:', post.id, '是否為轉發:', isRepost);
    
    let originalPost = null;
    if (isRepost && post.originalPostId) {
      originalPost = originalPosts[post.originalPostId];
      console.log('原始文章:', originalPost ? '已找到' : '未找到');
    }

    // 格式化日期
    let formattedDate = '未知時間';
    try {
      if (post.createdAt && typeof post.createdAt.toDate === 'function') {
        formattedDate = formatDistanceToNow(post.createdAt.toDate(), {
          addSuffix: true,
          locale: zhTW
        });
      }
    } catch (error) {
      console.error('日期格式化錯誤:', error);
    }

    return (
      <Grid item xs={12} sm={6} md={4} key={post.id}>
        {/* 使用 Framer Motion 添加動畫效果 */}
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="h-full"
        >
          {/* 文章卡片 */}
          <Card
            className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
            sx={{ 
              borderRadius: '16px', 
              height: '100%',
              background: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #1e1e1e, #2d2d2d)' 
                : 'linear-gradient(145deg, #ffffff, #f0f0f0)',
              boxShadow: theme => theme.palette.mode === 'dark'
                ? '5px 5px 15px #0d0d0d, -5px -5px 15px #2d2d2d'
                : '5px 5px 15px #d1d1d1, -5px -5px 15px #ffffff',
              position: 'relative',
              '&:after': isRepost ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, #3B82F6, #10B981)',
              } : {}
            }}
            onClick={() => navigate(`/post/${isRepost ? post.originalPostId || post.id : post.id}`)}
          >
            <CardContent className="p-6">
              {/* 轉發標識 */}
              {isRepost && (
                <div className="flex items-center mb-4 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                  <RepeatIcon 
                    className="mr-2 text-blue-500"
                    sx={{ fontSize: '1.25rem' }}
                  />
                  <Typography 
                    variant="body2"
                    className="text-blue-500 font-medium"
                    sx={{ fontSize: '0.875rem' }}
                  >
                    已轉發
                  </Typography>
                </div>
              )}

              {/* 文章標題 */}
              <Typography 
                variant="h6" 
                noWrap 
                className="font-bold text-gray-800 dark:text-white mb-3"
                sx={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 700,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {post.title}
              </Typography>

              {/* 發布時間 */}
              <Typography 
                variant="body2" 
                className="text-gray-500 dark:text-gray-400 mb-3"
                sx={{ fontSize: '0.875rem', fontStyle: 'italic' }}
              >
                {formattedDate}
              </Typography>

              {/* 文章內容預覽 */}
              <Typography 
                variant="body2" 
                className="text-gray-600 dark:text-gray-300 mb-4"
                sx={{ 
                  fontSize: '1rem', 
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: expandedPosts[post.id] ? 'unset' : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {post.content}
              </Typography>

              {/* 展開更多按鈕 */}
              {post.content && post.content.length > 100 && (
                <Box mt={1} mb={2}>
                  <Button 
                    variant="text" 
                    size="small"
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePostExpansion(post.id);
                    }}
                    sx={{ 
                      minWidth: 'auto', 
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      borderRadius: '12px',
                      backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      '&:hover': {
                        backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                      }
                    }}
                  >
                    {expandedPosts[post.id] ? '顯示較少' : '顯示更多'}
                  </Button>
                </Box>
              )}

              {/* 文章圖片預覽 - 只在不是轉發文章或者是轉發文章但沒有原始文章時顯示 */}
              {post.imageUrl && !isRepost && (
                <Box mt={2} className="relative" sx={{ 
                  height: '140px', 
                  overflow: 'hidden', 
                  borderRadius: '8px',
                  boxShadow: theme => theme.palette.mode === 'dark' 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' 
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                  <img 
                    src={post.imageUrl} 
                    alt="文章圖片" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </Box>
              )}

              {/* 如果是轉發文章，顯示原始文章內容 */}
              {isRepost && originalPost && (
                <Box 
                  mt={3} 
                  p={2} 
                  sx={{ 
                    backgroundColor: theme => theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.05)' 
                      : 'rgba(0,0,0,0.03)', 
                    borderRadius: '12px', 
                    border: theme => `1px solid ${theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0,0,0,0.1)'}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: '4px',
                      background: 'linear-gradient(to bottom, #3B82F6, #10B981)'
                    }
                  }}
                >
                  {/* 原文標題 */}
                  <Typography 
                    variant="subtitle1" 
                    className="font-semibold text-gray-800 dark:text-white mb-2 pl-2"
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    原文：{originalPost.title}
                  </Typography>

                  {/* 原文內容預覽 */}
                  <Typography 
                    variant="body2" 
                    className="text-gray-600 dark:text-gray-300 mb-2 pl-2"
                    sx={{ 
                      fontSize: '0.875rem', 
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {originalPost.content}
                  </Typography>

                  {/* 原文圖片預覽 */}
                  {originalPost.imageUrl && (
                    <Box mt={2} sx={{ 
                      height: '100px', 
                      overflow: 'hidden', 
                      borderRadius: '8px',
                      boxShadow: theme => theme.palette.mode === 'dark' 
                        ? '0 2px 4px rgba(0,0,0,0.3)' 
                        : '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <img 
                        src={originalPost.imageUrl} 
                        alt="原文圖片" 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    );
  };

  return (
    <Grid container spacing={4}>
      {activeTab === 0 ? (
        // 顯示原創文章列表
        posts && posts.length > 0 ? (
          posts.map(post => {
            console.log('渲染原創文章:', post.id);
            return renderPostCard(post, false);
          })
        ) : (
          // 當沒有原創文章時顯示的提示
          <Grid item xs={12}>
            <Typography 
              variant="body1" 
              align="center" 
              className="text-gray-500 dark:text-gray-400 py-12"
              sx={{ fontSize: '1.1rem', fontStyle: 'italic' }}
            >
              還沒有發表過文章，開始創作吧！
            </Typography>
          </Grid>
        )
      ) : (
        // 顯示轉發文章列表
        reposts && reposts.length > 0 ? (
          reposts.map(post => {
            console.log('渲染轉發文章:', post.id);
            return renderPostCard(post, true);
          })
        ) : (
          // 當沒有轉發文章時顯示的提示
          <Grid item xs={12}>
            <Typography 
              variant="body1" 
              align="center" 
              className="text-gray-500 dark:text-gray-400 py-12"
              sx={{ fontSize: '1.1rem', fontStyle: 'italic' }}
            >
              還沒有轉發過文章
            </Typography>
          </Grid>
        )
      )}
    </Grid>
  );
}

export default ProfilePostsList;
