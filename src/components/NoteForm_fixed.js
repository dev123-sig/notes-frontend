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
      '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐'
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

  // Initialize content only once when note prop changes
  useEffect(() => {
    if (note?.content && contentRef.current && !contentRef.current.innerHTML) {
      contentRef.current.innerHTML = convertMarkdownToHtml(note.content);
    }
  }, [note]);

  // Selection change handler for tracking active formats
  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    const debounced = (...args) => {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
    return debounced;
  };

  // Content update with debouncing to prevent cursor jumping
  const debouncedUpdateContent = useRef(
    debounce((htmlContent) => {
      const markdownContent = convertHtmlToMarkdown(htmlContent);
      setFormData(prev => ({ ...prev, content: markdownContent }));
    }, 1000)
  ).current;

  const handleInput = () => {
    const contentDiv = contentRef.current;
    if (contentDiv) {
      // Update active formats immediately for real-time feedback
      updateActiveFormats();
      
      // Debounce the content update to prevent cursor jumping
      debouncedUpdateContent(contentDiv.innerHTML);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const insertTextAtCursor = (text) => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;

    contentDiv.focus();
    
    if (document.execCommand) {
      document.execCommand('insertText', false, text);
    } else {
      // Fallback for browsers that don't support execCommand
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    updateContentFromDiv();
  };

  const wrapSelectedText = (command, value = null) => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;

    contentDiv.focus();
    
    try {
      // Use document.execCommand for real-time formatting
      const success = document.execCommand(command, false, value);
      if (success) {
        updateActiveFormats();
        updateContentFromDiv();
      }
    } catch (error) {
      console.error('Error applying formatting:', error);
    }
  };

  const updateContentFromDiv = () => {
    const contentDiv = contentRef.current;
    if (contentDiv) {
      const htmlContent = contentDiv.innerHTML;
      const markdownContent = convertHtmlToMarkdown(htmlContent);
      setFormData(prev => ({ ...prev, content: markdownContent }));
    }
  };

  const updateActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        bulletList: document.queryCommandState('insertUnorderedList')
      });
    } catch (error) {
      // Some browsers might not support queryCommandState
      console.warn('Could not update active formats:', error);
    }
  };

  const convertHtmlToMarkdown = (html) => {
    if (!html) return '';
    
    let markdown = html
      // Convert bold
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      // Convert italic
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      // Convert underline (note: markdown doesn't have native underline)
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      // Convert bullet points
      .replace(/<li>(.*?)<\/li>/g, '• $1')
      .replace(/<\/?ul>/g, '')
      // Convert line breaks
      .replace(/<br\s*\/?>/g, '\n')
      // Remove any other HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    return markdown;
  };

  const convertMarkdownToHtml = (markdown) => {
    if (!markdown) return '';
    
    let html = markdown
      // Convert bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert bullet points
      .replace(/^• (.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive list items in ul tags
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
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Bold"
              >
                <BoldIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handleFormatting('italic')}
                className={`p-2 rounded transition-all duration-200 ${
                  activeFormats.italic 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Italic"
              >
                <ItalicIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handleFormatting('underline')}
                className={`p-2 rounded transition-all duration-200 ${
                  activeFormats.underline 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handleFormatting('bulletList')}
                className={`p-2 rounded transition-all duration-200 ${
                  activeFormats.bulletList 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Bullet List"
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                  title="Insert Emoji"
                >
                  <FaceSmileIcon className="h-4 w-4" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 p-3 max-h-64 overflow-y-auto" style={{ width: '300px' }}>
                    {Object.entries(emojiCategories).map(([category, emojis]) => (
                      <div key={category} className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-600 mb-1">{category}</h4>
                        <div className="flex flex-wrap gap-1">
                          {emojis.map((emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="p-1 hover:bg-gray-100 rounded text-lg leading-none"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              ref={contentRef}
              contentEditable
              onInput={handleInput}
              className={`content-editor input-field min-h-[200px] rounded-t-none border-t-0 ${errors.content ? 'border-red-500' : ''}`}
              style={{ 
                whiteSpace: 'pre-wrap',
                outline: 'none'
              }}
              suppressContentEditableWarning={true}
              data-placeholder="Start writing your note content here..."
            />
            
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
            <div className="mt-1 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Supports <strong>bold</strong>, <em>italic</em>, <u>underline</u>, and bullet points
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
