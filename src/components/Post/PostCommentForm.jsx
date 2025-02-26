import React from 'react';
import { TextField, Button } from '@mui/material';

// PostCommentForm 組件：評論輸入表單
function PostCommentForm({ comment, setComment, handleComment }) {
  return (
    <form onSubmit={handleComment} className="mb-10">
      {/* 多行文本輸入框 */}
      <TextField
        multiline
        rows={4}
        fullWidth
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="分享你的想法..."
        className="mb-6 bg-white dark:bg-gray-700"
        InputProps={{
          className: 'dark:text-white rounded-lg',
        }}
      />
      {/* 按鈕容器 */}
      <div className="flex justify-end space-x-4 mt-4">
        {/* 取消按鈕 */}
        <Button 
          type="button" 
          variant="outlined"
          onClick={() => setComment('')}
          className="px-6 py-2 rounded-full text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          取消
        </Button>
        {/* 發表評論按鈕 */}
        <Button 
          type="submit" 
          variant="contained" 
          disabled={!comment}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-indigo-600 dark:to-purple-700 dark:hover:from-indigo-700 dark:hover:to-purple-800 text-white font-semibold px-8 py-2 rounded-full shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center text-white">
            {/* 發送圖標 */}
            <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-white">
              <g fill="none">
                <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/>
                <path fill="currentColor" d="M20.25 3.532a1 3.5 0 0 1 1.183 1.329l-6 15.5a1 3.5 0 0 1-1.624.362l-3.382-3.235l-1.203 1.202c-.636.636-1.724.186-1.724-.714v-3.288L2.309 9.723a1 3.5 0 0 1 .442-1.691l17.5-4.5Zm-2.114 4.305l-7.998 6.607l3.97 3.798zm-1.578-1.29L4.991 9.52l3.692 3.53l7.875-6.505Z"/>
              </g>
            </svg>
            發表評論
          </span>
        </Button>
      </div>
    </form>
  );
}

export default PostCommentForm;
