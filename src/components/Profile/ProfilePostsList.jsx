import React from 'react';
import { motion } from 'framer-motion';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import RepeatIcon from '@mui/icons-material/Repeat';

// ProfilePostsList 組件：顯示用戶的原創文章和轉發文章列表
function ProfilePostsList({ posts, reposts, activeTab, navigate }) {
  return (
    <Grid container spacing={4}>
      {activeTab === 0 ? (
        // 顯示原創文章列表
        posts.length > 0 ? (
          posts.map(post => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              {/* 使用 Framer Motion 添加動畫效果 */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {/* 文章卡片 */}
                <Card
                  className="h-full cursor-pointer hover:shadow-xl transition-all duration-300"
                  sx={{ 
                    borderRadius: '20px', 
                    height: '100%', 
                    background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
                    boxShadow: '5px 5px 15px #d1d1d1, -5px -5px 15px #ffffff'
                  }}
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <CardContent className="p-6">
                    {/* 文章標題 */}
                    <Typography 
                      variant="h6" 
                      noWrap 
                      className="font-bold text-gray-800 dark:text-white mb-3"
                      sx={{ fontSize: '1.25rem', fontWeight: 700 }}
                    >
                      {post.title}
                    </Typography>
                    {/* 發布時間 */}
                    <Typography 
                      variant="body2" 
                      className="text-gray-500 dark:text-gray-400 mb-3"
                      sx={{ fontSize: '0.875rem', fontStyle: 'italic' }}
                    >
                      {formatDistanceToNow(post.createdAt?.toDate(), { addSuffix: true, locale: zhTW })}
                    </Typography>
                    {/* 文章內容預覽 */}
                    <Typography 
                      variant="body2" 
                      className="text-gray-600 dark:text-gray-300 line-clamp-3"
                      sx={{ fontSize: '1rem', lineHeight: 1.6 }}
                    >
                      {post.content}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))
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
        reposts.length > 0 ? (
          reposts.map(post => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              {/* 使用 Framer Motion 添加動畫效果 */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {/* 轉發文章卡片 */}
                <Card
                  className="h-full cursor-pointer hover:shadow-xl transition-all duration-300"
                  sx={{ 
                    borderRadius: '20px', 
                    height: '100%', 
                    background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
                    boxShadow: '5px 5px 15px #d1d1d1, -5px -5px 15px #ffffff'
                  }}
                  onClick={() => navigate(`/post/${post.originalPostId || post.id}`)}
                >
                  <CardContent className="p-6">
                    {/* 轉發標識 */}
                    <div className="flex items-center mb-3">
                      <RepeatIcon 
                        className="mr-2 text-blue-500"
                        sx={{ fontSize: '1.25rem' }}
                      />
                      <Typography 
                        variant="body2"
                        className="text-blue-500"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        已轉發
                      </Typography>
                    </div>
                    {/* 轉發文章標題 */}
                    <Typography 
                      variant="h6" 
                      noWrap 
                      className="font-bold text-gray-800 dark:text-white mb-3"
                      sx={{ fontSize: '1.25rem', fontWeight: 700 }}
                    >
                      {post.title}
                    </Typography>
                    {/* 轉發時間 */}
                    <Typography 
                      variant="body2" 
                      className="text-gray-500 dark:text-gray-400 mb-3"
                      sx={{ fontSize: '0.875rem', fontStyle: 'italic' }}
                    >
                      {formatDistanceToNow(post.createdAt?.toDate(), { addSuffix: true, locale: zhTW })}
                    </Typography>
                    {/* 轉發文章內容預覽 */}
                    <Typography 
                      variant="body2" 
                      className="text-gray-600 dark:text-gray-300 line-clamp-3"
                      sx={{ fontSize: '1rem', lineHeight: 1.6 }}
                    >
                      {post.content}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))
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
