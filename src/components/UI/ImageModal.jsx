import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ImageModal 組件：圖片放大顯示模態框
function ImageModal({ isOpen, imageUrl, onClose }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={onClose}
        >
          <motion.img 
            src={imageUrl} 
            alt="放大圖片"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ImageModal;
