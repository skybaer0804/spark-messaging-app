import { useState, useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { memo } from 'preact/compat';
import { EMOJI_CATEGORIES, getEmojisByCategory, searchEmojis } from './utils/emojiData';
import { useFrequentEmojis } from './hooks/useFrequentEmojis';
import { useEmojiPicker } from './hooks/useEmojiPicker';
import './EmojiPicker.scss';

interface EmojiPickerProps {
  anchorRef: RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

function EmojiPickerComponent({ anchorRef, isOpen, onClose, onSelect }: EmojiPickerProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('smileys');
  const { frequent, addFrequent } = useFrequentEmojis();
  const position = useEmojiPicker(anchorRef, isOpen);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);
  
  const handleSelect = (emoji: string) => {
    addFrequent(emoji);
    onSelect(emoji);
    onClose();
  };
  
  if (!isOpen) return null;
  
  const searchResults = query.trim() ? searchEmojis(query) : [];
  const categoryEmojis = !query.trim() ? getEmojisByCategory(activeCategory) : [];
  const displayEmojis = query.trim() ? searchResults : categoryEmojis;
  
  return (
    <div
      ref={pickerRef}
      className="emoji-picker"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        visibility: position.isReady ? 'visible' : 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 검색 바 */}
      <div className="emoji-picker__search">
        <input
          type="text"
          className="emoji-picker__search-input"
          placeholder="검색"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          autoFocus
        />
      </div>
      
      {/* 자주 사용하는 이모지 */}
      {!query.trim() && frequent.length > 0 && (
        <div className="emoji-picker__section">
          <div className="emoji-picker__section-title">자주 사용하는</div>
          <div className="emoji-picker__grid">
            {frequent.map((emoji, idx) => (
              <button
                key={`frequent-${idx}`}
                className="emoji-picker__button"
                onClick={() => handleSelect(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 카테고리 탭 */}
      {!query.trim() && (
        <div className="emoji-picker__categories">
          {EMOJI_CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`emoji-picker__category ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
              title={category.name}
            >
              {category.icon}
            </button>
          ))}
        </div>
      )}
      
      {/* 이모지 그리드 */}
      <div className="emoji-picker__section">
        {query.trim() && (
          <div className="emoji-picker__section-title">
            {searchResults.length > 0 ? `검색 결과 (${searchResults.length})` : '검색 결과 없음'}
          </div>
        )}
        {!query.trim() && (
          <div className="emoji-picker__section-title">
            {EMOJI_CATEGORIES.find(c => c.id === activeCategory)?.name || '이모지'}
          </div>
        )}
        <div className="emoji-picker__grid">
          {displayEmojis.length > 0 ? (
            displayEmojis.map((emojiItem, idx) => (
              <button
                key={`${emojiItem.emoji}-${idx}`}
                className="emoji-picker__button"
                onClick={() => handleSelect(emojiItem.emoji)}
                title={emojiItem.name}
              >
                {emojiItem.emoji}
              </button>
            ))
          ) : (
            <div className="emoji-picker__empty">이모지를 찾을 수 없습니다</div>
          )}
        </div>
      </div>
    </div>
  );
}

export const EmojiPicker = memo(EmojiPickerComponent);
