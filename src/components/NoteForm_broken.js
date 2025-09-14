import React, { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon,
  ListBulletIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';

const NoteForm = ({ note, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    bulletList: false
  });
  const contentRef = useRef(null);

  // Organized emojis by categories for better UX
  const emojiCategories = {
    'Smileys': [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', 
      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰'
    ],
    'Emotions': [
      '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
      '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'
    ],
    'Reactions': [
      '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠'
    ],
    'Hands': [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '�'
    ],
    'Hearts': [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘'
    ],
    'Symbols': [
      '🔥', '⭐', '🌟', '✨', '⚡', '💯', '💢', '💥',
      '💫', '💦', '☮️', '💝', '💟', '🎉', '🎊', '🚀'
    ]
  };

  useEffect(() => {
    // Focus on content when component mounts and set initial content ONCE
    if (contentRef.current) {
      // Only set initial content when creating new note or editing existing note
      // Don't update during typing to avoid cursor issues
      if (note && note.content && contentRef.current.innerHTML === '') {
        // Editing existing note - set initial content
        const htmlContent = convertMarkdownToHtml(formData.content);
        contentRef.current.innerHTML = htmlContent;
      } else if (!note && contentRef.current.innerHTML === '') {
        // New note - start empty but focus
        contentRef.current.focus();
      }
      
      // Add selection change listeners to update active formats
      const contentDiv = contentRef.current;
      contentDiv.addEventListener('mouseup', handleSelectionChange);
      contentDiv.addEventListener('keyup', handleSelectionChange);
      
      // Cleanup listeners on unmount
      return () => {
        if (contentDiv) {
          contentDiv.removeEventListener('mouseup', handleSelectionChange);
          contentDiv.removeEventListener('keyup', handleSelectionChange);
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  // Add debounced content update to avoid cursor jumping
  const debouncedUpdateContent = useRef();
  
  useEffect(() => {
    debouncedUpdateContent.current = debounce(() => {
      updateContentFromDiv();
    }, 1000); // Update after 1 second of no typing
    
    return () => {
      if (debouncedUpdateContent.current) {
        debouncedUpdateContent.current.cancel();
      }
    };
  }, []);

  // Simple debounce function
  function debounce(func, wait) {
    let timeout;
    const debounced = (...args) => {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
    debounced.cancel = () => {
      clearTimeout(timeout);
    };
    return debounced;
  }

  const handleInput = () => {
    // Update active formats immediately for UI feedback
    handleSelectionChange();
    // Debounce the actual content update to avoid cursor issues
    if (debouncedUpdateContent.current) {
      debouncedUpdateContent.current();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length > 10000) {
      newErrors.content = 'Content must be less than 10,000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length > 10000) {
      newErrors.content = 'Content must be less than 10,000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        content: formData.content.trim()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const insertTextAtCursor = (text) => {
    const div = contentRef.current;
    if (!div) return;

    // Insert text at current cursor position in contentEditable div
    document.execCommand('insertText', false, text);
    
    // Update the formData content
    updateContentFromDiv();
    
    // Keep focus on the div
    div.focus();
  };

  const wrapSelectedText = (command, value = null) => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;

    contentDiv.focus();
    
    // Use browser's built-in formatting commands for real-time formatting
    try {
      document.execCommand(command, false, value);
    } catch (error) {
      console.error('Formatting command failed:', error);
    }
    
    // Update the content state
    updateContentFromDiv();
    
    // Update active formats after applying formatting
    setTimeout(() => {
      updateActiveFormats();
    }, 10);
  };

  const updateContentFromDiv = () => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;
    
    // Get the HTML content and convert it to our format for storage
    const htmlContent = contentDiv.innerHTML;
    const textContent = convertHtmlToMarkdown(htmlContent);
    handleInputChange('content', textContent);
  };

  // Function to check current formatting state at cursor position
  const updateActiveFormats = () => {
    if (!contentRef.current) return;
    
    try {
      const isBold = document.queryCommandState('bold');
      const isItalic = document.queryCommandState('italic');
      const isUnderline = document.queryCommandState('underline');
      const isBulletList = document.queryCommandState('insertUnorderedList');
      
      setActiveFormats({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        bulletList: isBulletList
      });
    } catch (error) {
      // Silently handle any errors with queryCommandState
      console.warn('Error checking format state:', error);
    }
  };

  // Handle cursor/selection changes to update active formats
  const handleSelectionChange = () => {
    updateActiveFormats();
  };

  const convertHtmlToMarkdown = (html) => {
    let text = html;
    
    // Convert HTML tags back to markdown for storage
    text = text.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    text = text.replace(/<b>(.*?)<\/b>/g, '**$1**');
    text = text.replace(/<em>(.*?)<\/em>/g, '*$1*');
    text = text.replace(/<i>(.*?)<\/i>/g, '*$1*');
    text = text.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
    text = text.replace(/<br\s*\/?>/g, '\n');
    text = text.replace(/<div>(.*?)<\/div>/g, '\n$1');
    text = text.replace(/<p>(.*?)<\/p>/g, '$1\n');
    
    // Handle list conversion - preserve proper list formatting
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gs, '• $1\n');
    text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gs, '$1');
    text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gs, '$1');
    
    // Clean up extra line breaks and spaces
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.trim();
    
    return text;
  };

  const convertMarkdownToHtml = (markdown) => {
    let html = markdown;
    
    // Convert markdown to HTML for display
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
    
    // Convert bullet points - handle both • and - as bullets
    html = html.replace(/^[•-] (.*)$/gm, '<li>$1</li>');
    
    // Wrap consecutive list items in <ul>
    html = html.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
      return '<ul>' + match + '</ul>';
    });
    
    // Convert line breaks to <br> tags (but not inside lists)
    html = html.replace(/\n(?![^<]*<\/li>)/g, '<br>');
    
    return html;
  };

  const handleFormatting = (type) => {
    switch (type) {
      case 'bold':
        wrapSelectedText('bold');
        break;
      case 'italic':
        wrapSelectedText('italic');
        break;
      case 'underline':
        wrapSelectedText('underline');
        break;
      case 'bulletList':
        insertBulletPoint();
        break;
      default:
        break;
    }
  };

  const insertBulletPoint = () => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;

    contentDiv.focus();
    
    // Use document.execCommand for bullet lists - simpler and more reliable
    try {
      document.execCommand('insertUnorderedList', false, null);
    } catch (error) {
      // Fallback: insert bullet text manually
      document.execCommand('insertText', false, '• ');
    }
    
    updateContentFromDiv();
  };

  const insertEmoji = (emoji) => {
    insertTextAtCursor(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white m-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {note ? 'Edit Note' : 'Create New Note'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`input-field ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter note title..."
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/200 characters
            </p>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            
            {/* Formatting Toolbar */}
            <div className="flex items-center space-x-2 p-2 bg-gray-50 border border-gray-300 rounded-t-md border-b-0">
              <button
                type="button"
                onClick={() => handleFormatting('bold')}
                className={`p-2 rounded transition-all duration-200 ${
                  activeFormats.bold 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title="Bold (wrap with **text**)"
              >
                <BoldIcon className="h-4 w-4" />
              </button>
              
              <button
                type="button"
                onClick={() => handleFormatting('italic')}
                className={`p-2 rounded transition-all duration-200 ${
                  activeFormats.italic 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title="Italic (wrap with *text*)"
              >
                <ItalicIcon className="h-4 w-4" />
              </button>
              
              <button
                type="button"
                onClick={() => handleFormatting('underline')}
                className={`p-2 rounded transition-all duration-200 ${
                  activeFormats.underline 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title="Underline (wrap with <u>text</u>)"
              >
                <UnderlineIcon className="h-4 w-4" />
              </button>
              
              <div className="w-px h-6 bg-gray-300"></div>
              
              <button
                type="button"
                onClick={() => handleFormatting('bulletList')}
                className={`p-2 rounded transition-all duration-200 ${
                  activeFormats.bulletList 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title="Bullet Point"
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              
              <div className="w-px h-6 bg-gray-300"></div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded transition-all duration-200 ${
                    showEmojiPicker 
                      ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                  title="Insert Emoji"
                  aria-label={showEmojiPicker ? "Close emoji picker" : "Open emoji picker"}
                  aria-expanded={showEmojiPicker}
                >
                  <FaceSmileIcon className="h-4 w-4" />
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-10 w-96">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Select an Emoji</h4>
                      <div className="max-h-80 overflow-y-auto space-y-4">
                        {Object.entries(emojiCategories).map(([category, emojis]) => (
                          <div key={category}>
                            <h5 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                              {category}
                            </h5>
                            <div className="grid grid-cols-8 gap-2">
                              {emojis.map((emoji, index) => (
                                <button
                                  key={`${category}-${index}`}
                                  type="button"
                                  onClick={() => insertEmoji(emoji)}
                                  className="p-3 hover:bg-blue-50 rounded-lg text-xl transition-all duration-150 border border-transparent hover:border-blue-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-110"
                                  title={`Insert ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Click any emoji to insert</span>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(false)}
                          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1"></div>
              
              <p className="text-xs text-gray-500">
                Use the toolbar above for instant formatting, or type directly
              </p>
            </div>
            
            <div
              ref={contentRef}
              contentEditable="true"
              role="textbox"
              aria-label="Note content"
              aria-multiline="true"
              onBlur={updateContentFromDiv}
              onInput={handleInput}
              onMouseUp={handleSelectionChange}
              className={`input-field content-editor resize-none rounded-t-none border-t-0 min-h-[300px] p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.content ? 'border-red-500' : ''}`}
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                outline: 'none'
              }}
              suppressContentEditableWarning={true}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
            <div className="mt-1 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Tip: Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
              </p>
              <p className={`text-xs ${
                formData.content.length > 9000 ? 'text-red-500' : 
                formData.content.length > 7500 ? 'text-orange-500' : 'text-gray-500'
              }`}>
                {formData.content.length}/10,000 characters
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
            >
              {loading ? 'Saving...' : (note ? 'Update Note' : 'Create Note')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteForm;
