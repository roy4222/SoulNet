import React from 'react';
import { CircularProgress, Typography } from '@mui/material';

function LoadingState({ isLoading, error }) {
  // 如果正在載入，顯示載入中的畫面
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  // 如果有錯誤，顯示錯誤訊息
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Typography color="error">{error}</Typography>
      </div>
    );
  }

  // 如果既不是載入中也沒有錯誤，則返回 null
  return null;
}

export default LoadingState;
