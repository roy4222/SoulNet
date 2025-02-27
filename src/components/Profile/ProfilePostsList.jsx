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
  const [isLoaded, setIsLoaded] = useState(false);
  const theme = useTheme();

  // 頁面載入動畫
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
  const renderPostCard = (post, isRepost = false, index = 0) => {
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            delay: index * 0.1 // 添加延遲，使卡片依次顯示
          }}
          whileHover={{ scale: 1.03, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="h-full"
        >
          {/* 文章卡片 */}
          <Card
            className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
            sx={{ 
              borderRadius: '16px', 
              height: '100%',
              background: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #f0f0f0, #ffffff)' 
                : 'linear-gradient(145deg, #ffffff, #f5f7fa)',
              boxShadow: theme => theme.palette.mode === 'dark'
                ? '0 10px 20px rgba(0,0,0,0.25), 0 6px 6px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.9)'
                : '0 10px 20px rgba(0,0,0,0.05), 0 6px 6px rgba(0,0,0,0.03), inset 0 1px 1px rgba(255,255,255,0.8)',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 15px 30px rgba(0,0,0,0.4), 0 10px 10px rgba(0,0,0,0.3)'
                  : '0 15px 30px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.05)'
              },
              '&:after': isRepost ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
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
                className="font-bold text-gray-800 dark:text-gray-800 mb-3"
                sx={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 700,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  background: theme => theme.palette.mode === 'dark' 
                    ? 'linear-gradient(90deg, #111827, #1f2937)' 
                    : 'linear-gradient(90deg, #1a1c23, #272935)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: theme => theme.palette.mode === 'dark' ? 'inherit' : 'inherit',
                  letterSpacing: '0.5px',
                  textShadow: 'none'
                }}
              >
              </Typography>

              {/* 發布時間 */}
              <Typography 
                variant="body2" 
                className="text-gray-500 dark:text-gray-600 mb-3"
                sx={{ 
                  fontSize: '0.875rem', 
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: 0.85
                }}
              >
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: theme => theme.palette.mode === 'dark' ? '#10B981' : '#3B82F6',
                  marginRight: '6px'
                }}></span>
                {formattedDate}
              </Typography>

              {/* 文章內容預覽 */}
              <Typography 
                variant="body2" 
                className="text-gray-600 dark:text-gray-700 mb-4"
                sx={{ 
                  fontSize: '1rem', 
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: expandedPosts[post.id] ? 'unset' : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.75)',
                  position: 'relative',
                  paddingLeft: '2px',
                  '&:first-letter': {
                    fontSize: '1.2em',
                    fontWeight: 'bold'
                  }
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
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      borderRadius: '20px',
                      backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                      color: theme => theme.palette.mode === 'dark' ? '#2563eb' : '#3B82F6',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        transform: 'translateY(-2px)'
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
                  height: '160px', 
                  overflow: 'hidden', 
                  borderRadius: '12px',
                  boxShadow: theme => theme.palette.mode === 'dark' 
                    ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.4) 100%)',
                    pointerEvents: 'none',
                    borderRadius: '12px',
                    opacity: 0.6
                  }
                }}>
                  <img 
                    src={post.imageUrl} 
                    alt="文章圖片" 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    style={{ 
                      filter: theme => theme.palette.mode === 'dark' ? 'brightness(0.9)' : 'none'
                    }}
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
                      ? 'rgba(0,0,0,0.03)' 
                      : 'rgba(0,0,0,0.02)', 
                    borderRadius: '12px', 
                    border: theme => `1px solid ${theme.palette.mode === 'dark' 
                      ? 'rgba(0,0,0,0.1)' 
                      : 'rgba(0,0,0,0.08)'}`,
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: theme => theme.palette.mode === 'dark' 
                        ? 'rgba(0,0,0,0.03)' 
                        : 'rgba(0,0,0,0.03)',
                      transform: 'scale(1.01)'
                    },
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: '4px',
                      background: 'linear-gradient(to bottom, #3B82F6, #10B981)',
                      boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
                    }
                  }}
                >
                  {/* 原文標題 */}
                  <Typography 
                    variant="subtitle1" 
                    className="font-semibold text-gray-800 dark:text-gray-800 mb-2 pl-2"
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                      paddingLeft: '10px',
                      color: theme => theme.palette.mode === 'dark' ? '#000000' : 'inherit',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '80%',
                        backgroundColor: theme => theme.palette.mode === 'dark' ? '#2563eb' : '#3B82F6',
                        borderRadius: '2px'
                      }
                    }}
                  >
                    原文：{originalPost.title}
                  </Typography>

                  {/* 原文內容預覽 */}
                  <Typography 
                    variant="body2" 
                    className="text-gray-600 dark:text-gray-700 mb-2 pl-2"
                    sx={{ 
                      fontSize: '0.875rem', 
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.75)' : 'inherit'
                    }}
                  >
                    {originalPost.content}
                  </Typography>

                  {/* 原文圖片預覽 */}
                  {originalPost.imageUrl && (
                    <Box mt={2} sx={{ 
                      height: '120px', 
                      overflow: 'hidden', 
                      borderRadius: '10px',
                      boxShadow: theme => theme.palette.mode === 'dark' 
                        ? '0 4px 8px rgba(0,0,0,0.4)' 
                        : '0 4px 8px rgba(0,0,0,0.15)',
                      position: 'relative',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.3) 100%)',
                        pointerEvents: 'none',
                        borderRadius: '10px',
                        opacity: 0.5
                      }
                    }}>
                      <img 
                        src={originalPost.imageUrl} 
                        alt="原文圖片" 
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                        style={{ 
                          filter: theme => theme.palette.mode === 'dark' ? 'brightness(0.85) contrast(1.1)' : 'none'
                        }}
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
    <Box sx={{ 
      position: 'relative',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        height: '1px',
        background: theme => theme.palette.mode === 'dark' 
          ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' 
          : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)',
        zIndex: 1
      }
    }}>
      <Grid container spacing={4}>
        {activeTab === 0 ? (
          // 顯示原創文章列表
          posts && posts.length > 0 ? (
            posts.map((post, index) => {
              console.log('渲染原創文章:', post.id);
              return renderPostCard(post, false, index);
            })
          ) : (
            // 當沒有原創文章時顯示的提示
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Typography 
                  variant="body1" 
                  align="center" 
                  className="text-gray-500 dark:text-gray-600 py-12"
                  sx={{ 
                    fontSize: '1.1rem', 
                    fontStyle: 'italic',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    height: '200px',
                    background: theme => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(145deg, #f0f0f0, #ffffff)' 
                      : 'linear-gradient(145deg, #ffffff, #f5f7fa)',
                    borderRadius: '16px',
                    boxShadow: theme => theme.palette.mode === 'dark'
                      ? 'inset 0 2px 6px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)'
                      : 'inset 0 2px 6px rgba(0,0,0,0.05), 0 1px 2px rgba(255,255,255,0.8)',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      width: '60px',
                      height: '60px',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23999\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1\' d=\'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'contain',
                      opacity: 0.5
                    }
                  }}
                >
                  還沒有發表過文章，開始創作吧！
                </Typography>
              </motion.div>
            </Grid>
          )
        ) : (
          // 顯示轉發文章列表
          reposts && reposts.length > 0 ? (
            reposts.map((post, index) => {
              console.log('渲染轉發文章:', post.id);
              return renderPostCard(post, true, index);
            })
          ) : (
            // 當沒有轉發文章時顯示的提示
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Typography 
                  variant="body1" 
                  align="center" 
                  className="text-gray-500 dark:text-gray-600 py-12"
                  sx={{ 
                    fontSize: '1.1rem', 
                    fontStyle: 'italic',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    height: '200px',
                    background: theme => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(145deg, #f0f0f0, #ffffff)' 
                      : 'linear-gradient(145deg, #ffffff, #f5f7fa)',
                    borderRadius: '16px',
                    boxShadow: theme => theme.palette.mode === 'dark'
                      ? 'inset 0 2px 6px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)'
                      : 'inset 0 2px 6px rgba(0,0,0,0.05), 0 1px 2px rgba(255,255,255,0.8)',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      width: '60px',
                      height: '60px',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23999\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1\' d=\'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'contain',
                      opacity: 0.5
                    }
                  }}
                >
                  還沒有轉發過文章
                </Typography>
              </motion.div>
            </Grid>
          )
        )}
      </Grid>
    </Box>
  );
}

export default ProfilePostsList;
