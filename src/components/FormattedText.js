import React from 'react';

const FormattedText = ({ text, className = '', maxLines = null }) => {
  const formatText = (text) => {
    if (!text) return '';
    
    let formatted = text;
    
    // Clean up broken formatting markers first
    formatted = formatted.replace(/\*\*\s*\n\s*\*\*/g, '**\n**');  // Fix broken bold across lines
    formatted = formatted.replace(/\*\s*\n\s*\*/g, '*\n*');        // Fix broken italic across lines
    formatted = formatted.replace(/\*\*\s*\*\*/g, '');             // Remove empty bold markers
    formatted = formatted.replace(/(?<!\*)\*\s*\*(?!\*)/g, '');    // Remove empty italic markers
    
    // Convert **bold** to <strong> - handle multiline bold
    formatted = formatted.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em> - handle multiline italic
    formatted = formatted.replace(/(?<!\*)\*([^*\n]*(?:\n[^*\n]*)*)\*(?!\*)/g, '<em>$1</em>');
    
    // Convert <u>underline</u> (already in HTML format)
    // No need to convert as it's already HTML
    
    // Convert bullet points to proper list items
    formatted = formatted.replace(/^• (.*)$/gm, '<li>$1</li>');
    
    // Wrap consecutive list items in <ul>
    formatted = formatted.replace(/(<li>.*<\/li>\s*)+/gs, (match) => {
      return '<ul class="list-disc list-inside my-2 space-y-1">' + match + '</ul>';
    });
    
    // Convert line breaks to <br> tags (but not inside lists)
    formatted = formatted.replace(/\n(?![^<]*<\/li>)/g, '<br />');
    
    return formatted;
  };

  const formattedContent = formatText(text);
  
  const baseClasses = `prose prose-sm max-w-none ${className}`;
  const lineClampClass = maxLines ? `line-clamp-${maxLines}` : '';
  const finalClasses = `${baseClasses} ${lineClampClass}`.trim();

  return (
    <div 
      className={finalClasses}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
      style={{
        lineHeight: '1.6',
        // Custom styles for better formatting
        wordBreak: 'break-word'
      }}
    />
  );
};

export default FormattedText;
