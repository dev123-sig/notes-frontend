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

  const handleKeyDown = (e) => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const currentElement = range.startContainer.nodeType === Node.TEXT_NODE 
        ? range.startContainer.parentElement 
        : range.startContainer;

      // Check if we're in a list
      const listItem = currentElement.closest('li');
      const list = currentElement.closest('ul, ol');

      if (listItem && list) {
        // We're in a list item
        const currentText = listItem.textContent.trim();
        
        if (currentText === '') {
          // Empty list item - exit the list
          e.preventDefault();
          
          // Create a new div after the list
          const newDiv = document.createElement('div');
          newDiv.innerHTML = '<br>';
          
          // Insert after the list
          list.parentNode.insertBefore(newDiv, list.nextSibling);
          
          // Remove the empty list item
          if (listItem.parentNode.children.length === 1) {
            // Last item in list, remove the whole list
            list.remove();
          } else {
            listItem.remove();
          }
          
          // Set cursor in the new div
          const newRange = document.createRange();
          newRange.setStart(newDiv, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          // Create a new list item
          const newListItem = document.createElement('li');
          newListItem.innerHTML = '<br>';
          
          // Insert after current list item
          listItem.parentNode.insertBefore(newListItem, listItem.nextSibling);
          
          // Set cursor in new list item
          const newRange = document.createRange();
          newRange.setStart(newListItem, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        // Regular line break - create new div
        const newDiv = document.createElement('div');
        newDiv.innerHTML = '<br>';
        
        range.deleteContents();
        range.insertNode(newDiv);
        
        // Move cursor to the new line
        const newRange = document.createRange();
        newRange.setStart(newDiv, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      // Update content
      setTimeout(() => {
        updateContentFromDiv();
        updateActiveFormats();
      }, 10);
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

    // Get the final content from the contentEditable div right before submission
    const contentDiv = contentRef.current;
    if (contentDiv) {
      // Get the text content with simplified markdown conversion
      let finalContent = '';
      
      // Process each child node to extract formatted content
      const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();
          const childContent = Array.from(node.childNodes).map(processNode).join('');
          
          switch (tagName) {
            case 'strong':
            case 'b':
              return `**${childContent}**`;
            case 'em':
            case 'i':
              return `*${childContent}*`;
            case 'u':
              return `<u>${childContent}</u>`;
            case 'li':
              return `• ${childContent}\n`;
            case 'ul':
            case 'ol':
              return childContent;
            case 'div':
              return childContent + '\n';
            case 'br':
              return '\n';
            default:
              return childContent;
          }
        }
        return '';
      };
      
      finalContent = Array.from(contentDiv.childNodes).map(processNode).join('')
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple line breaks
        .replace(/^\s*\n/, '') // Remove leading line breaks
        .replace(/\n\s*$/, '') // Remove trailing line breaks
        .trim();
      
      // Update formData with the latest content
      const submissionData = {
        ...formData,
        content: finalContent
      };
      
      setLoading(true);
      try {
        await onSubmit(submissionData);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setLoading(false);
      }
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
    
    // First, handle lists properly by preserving line structure
    let markdown = html
      // Convert bullet points - handle nested content better
      .replace(/<li[^>]*>(.*?)<\/li>/gs, (match, content) => {
        // Clean up the content inside li tags
        const cleanContent = content
          .replace(/<br\s*\/?>/g, ' ')
          .replace(/<[^>]*>/g, '')
          .trim();
        return cleanContent ? `• ${cleanContent}\n` : '• \n';
      })
      // Remove ul/ol tags
      .replace(/<\/?[uo]l[^>]*>/g, '')
      // Handle formatting spans that might be broken by line breaks
      // First normalize spaces and breaks within formatting tags
      .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gs, (match, tag1, content, tag2) => {
        const cleanContent = content
          .replace(/<br\s*\/?>/g, '\n')
          .replace(/<div[^>]*>/g, '\n')
          .replace(/<\/div>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return cleanContent ? `**${cleanContent}**` : '';
      })
      .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gs, (match, tag1, content, tag2) => {
        const cleanContent = content
          .replace(/<br\s*\/?>/g, '\n')
          .replace(/<div[^>]*>/g, '\n')
          .replace(/<\/div>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return cleanContent ? `*${cleanContent}*` : '';
      })
      .replace(/<u[^>]*>(.*?)<\/u>/gs, (match, content) => {
        const cleanContent = content
          .replace(/<br\s*\/?>/g, '\n')
          .replace(/<div[^>]*>/g, '\n')
          .replace(/<\/div>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return cleanContent ? `<u>${cleanContent}</u>` : '';
      })
      // Convert div elements to line breaks
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<\/div>/g, '')
      // Convert paragraph elements to line breaks
      .replace(/<p[^>]*>/g, '\n')
      .replace(/<\/p>/g, '\n')
      // Convert line breaks
      .replace(/<br\s*\/?>/g, '\n')
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Fix broken formatting markers caused by line breaks
      .replace(/\*\*\s*\n\s*\*\*/g, '**\n**')  // Fix broken bold across lines
      .replace(/\*\s*\n\s*\*/g, '*\n*')        // Fix broken italic across lines
      // Clean up excess formatting markers
      .replace(/\*\*\s*\*\*/g, '')              // Remove empty bold markers
      .replace(/(?<!\*)\*\s*\*(?!\*)/g, '')     // Remove empty italic markers
      // Clean up whitespace and normalize line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s*\n/, '')
      .replace(/\n\s*$/, '')
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
    
    // Split by lines and wrap each non-empty line in a div
    const lines = html.split('\n');
    html = lines.map(line => {
      line = line.trim();
      if (!line) return '<div><br></div>'; // Empty line for spacing
      if (line.startsWith('<ul>')) return line; // Don't wrap list containers
      return `<div>${line}</div>`;
    }).join('');
    
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
        toggleBulletList();
        break;
      default:
        break;
    }
  };

  const toggleBulletList = () => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;

    contentDiv.focus();
    
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const currentElement = range.startContainer.nodeType === Node.TEXT_NODE 
      ? range.startContainer.parentElement 
      : range.startContainer;

    // Check if we're currently in a list
    const existingList = currentElement.closest('ul');
    const existingListItem = currentElement.closest('li');

    if (existingList && existingListItem) {
      // We're in a list - check if we should exit or remove current item
      const listItemContent = existingListItem.innerHTML.trim();
      const isEmptyItem = listItemContent === '<br>' || listItemContent === '' || listItemContent === '&nbsp;';
      
      if (isEmptyItem) {
        // Empty item - remove just this item or convert to regular text
        exitBulletList(existingList, existingListItem);
      } else {
        // Item has content - create new regular div after the list
        createRegularTextAfterList(existingList);
      }
    } else {
      // We're not in a list - create one
      insertBulletPoint();
    }
  };

  const exitBulletList = (list, currentItem) => {
    const selection = window.getSelection();
    
    // If it's the only item in the list, convert the whole list to a regular div
    if (list.children.length === 1) {
      const newDiv = document.createElement('div');
      newDiv.innerHTML = '<br>';
      list.parentNode.replaceChild(newDiv, list);
      
      // Set cursor in the new div
      const newRange = document.createRange();
      newRange.setStart(newDiv, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Multiple items - just remove the current empty item and create a div after the list
      currentItem.remove();
      
      // Create a new div after the list
      const newDiv = document.createElement('div');
      newDiv.innerHTML = '<br>';
      list.parentNode.insertBefore(newDiv, list.nextSibling);
      
      // Set cursor in the new div
      const newRange = document.createRange();
      newRange.setStart(newDiv, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    
    updateContentFromDiv();
    updateActiveFormats();
  };

  const createRegularTextAfterList = (list) => {
    const selection = window.getSelection();
    
    // Create a new div after the list
    const newDiv = document.createElement('div');
    newDiv.innerHTML = '<br>';
    list.parentNode.insertBefore(newDiv, list.nextSibling);
    
    // Set cursor in the new div
    const newRange = document.createRange();
    newRange.setStart(newDiv, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    updateContentFromDiv();
    updateActiveFormats();
  };

  // Unused function - commented out to fix build warnings
  // const removeBulletList = (list, currentItem) => {
  //   const contentDiv = contentRef.current;
  //   const selection = window.getSelection();
  //   
  //   // Convert all list items back to regular divs
  //   const listItems = Array.from(list.children);
  //   const newDivs = [];
  //   
  //   listItems.forEach((item, index) => {
  //     const newDiv = document.createElement('div');
  //     if (item.innerHTML.trim() === '<br>' || item.innerHTML.trim() === '') {
  //       newDiv.innerHTML = '<br>';
  //     } else {
  //       newDiv.innerHTML = item.innerHTML;
  //     }
  //     newDivs.push(newDiv);
  //   });
  //   
  //   // Find which item was the current one
  //   const currentIndex = listItems.indexOf(currentItem);
  //   
  //   // Replace the list with the new divs
  //   newDivs.forEach((div, index) => {
  //     if (index === 0) {
  //       list.parentNode.insertBefore(div, list);
  //     } else {
  //       list.parentNode.insertBefore(div, list);
  //     }
  //   });
  //   
  //   // Remove the original list
  //   list.remove();
  //   
  //   // Set cursor in the div that corresponds to where we were
  //   if (newDivs[currentIndex]) {
  //     const newRange = document.createRange();
  //     newRange.setStart(newDivs[currentIndex], 0);
  //     newRange.collapse(true);
  //     selection.removeAllRanges();
  //     selection.addRange(newRange);
  //   }
  //   
  //   updateContentFromDiv();
  //   updateActiveFormats();
  // };

  const insertBulletPoint = () => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;

    contentDiv.focus();
    
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const currentElement = range.startContainer.nodeType === Node.TEXT_NODE 
      ? range.startContainer.parentElement 
      : range.startContainer;

    // Check if we're already in a list
    const existingList = currentElement.closest('ul');
    const existingListItem = currentElement.closest('li');

    if (existingList && existingListItem) {
      // We're in a list - check if we should remove it or add new item
      // If the current list item is empty or only has a <br>, remove the list
      const listItemContent = existingListItem.innerHTML.trim();
      const isEmptyItem = listItemContent === '<br>' || listItemContent === '' || listItemContent === '&nbsp;';
      
      if (isEmptyItem && existingList.children.length === 1) {
        // Only one empty item - convert back to regular div
        const newDiv = document.createElement('div');
        newDiv.innerHTML = '<br>';
        existingList.parentNode.replaceChild(newDiv, existingList);
        
        // Set cursor in the new div
        const newRange = document.createRange();
        newRange.setStart(newDiv, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else if (isEmptyItem) {
        // Multiple items but current is empty - remove this item and exit list
        const listItems = Array.from(existingList.children);
        const currentIndex = listItems.indexOf(existingListItem);
        
        if (currentIndex === listItems.length - 1) {
          // Last item - create new div after list
          const newDiv = document.createElement('div');
          newDiv.innerHTML = '<br>';
          existingList.parentNode.insertBefore(newDiv, existingList.nextSibling);
          existingListItem.remove();
          
          // Set cursor in the new div
          const newRange = document.createRange();
          newRange.setStart(newDiv, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          // Not last item - just remove current item
          existingListItem.remove();
        }
      } else {
        // Current item has content - create a new list item
        const newListItem = document.createElement('li');
        newListItem.innerHTML = '<br>';
        existingListItem.parentNode.insertBefore(newListItem, existingListItem.nextSibling);
        
        // Set cursor in new list item
        const newRange = document.createRange();
        newRange.setStart(newListItem, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      // Not in a list, create a new one or convert current line
      const currentDiv = currentElement.closest('div');
      
      if (currentDiv && currentDiv.parentNode === contentDiv) {
        // Convert current div to a list
        const listContainer = document.createElement('ul');
        const listItem = document.createElement('li');
        
        // Move content from div to list item
        if (currentDiv.innerHTML === '<br>' || currentDiv.innerHTML === '') {
          listItem.innerHTML = '<br>';
        } else {
          listItem.innerHTML = currentDiv.innerHTML;
        }
        
        listContainer.appendChild(listItem);
        currentDiv.parentNode.replaceChild(listContainer, currentDiv);
        
        // Set cursor in the list item
        const newRange = document.createRange();
        newRange.setStart(listItem, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // Fallback: use execCommand
        try {
          document.execCommand('insertUnorderedList', false, null);
        } catch (error) {
          // Last resort: insert bullet text manually
          document.execCommand('insertText', false, '• ');
        }
      }
    }
    
    updateContentFromDiv();
    updateActiveFormats();
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
              onKeyDown={handleKeyDown}
              className={`content-editor input-field min-h-[200px] max-h-[400px] overflow-y-auto rounded-t-none border-t-0 ${errors.content ? 'border-red-500' : ''}`}
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
