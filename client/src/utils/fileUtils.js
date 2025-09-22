/**
 * File utility functions
 * Centralized file handling logic for the chat application
 */

/**
 * Get appropriate icon for file type
 * @param {string} mimeType - MIME type of the file
 * @returns {string} - Emoji icon for the file type
 */
export const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('text/')) return '📝';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📄';
  return '📎';
};

/**
 * Check if file type is supported
 * @param {File} file - File object to check
 * @returns {boolean} - Whether file type is supported
 */
export const isFileTypeSupported = (file) => {
  const supportedTypes = [
    'image/', 
    'application/pdf', 
    'text/', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument'
  ];
  const supportedExtensions = /\.(png|jpg|jpeg|gif|webp|pdf|txt|doc|docx)$/i;
  
  return supportedTypes.some(type => file.type.startsWith(type)) || 
         supportedExtensions.test(file.name);
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Generate file markdown syntax
 * @param {File} file - File object
 * @returns {string} - Markdown syntax for the file
 */
export const generateFileMarkdown = (file) => {
  const timestamp = Date.now();
  if (file.type.startsWith('image/')) {
    return `![${file.name}](image_placeholder_${timestamp})`;
  }
  return `📎 [${file.name}](file_placeholder_${timestamp})`;
};
