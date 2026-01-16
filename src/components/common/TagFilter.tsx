import React from 'react';

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ 
  allTags, 
  selectedTags, 
  onTagToggle, 
  onClearAll 
}) => {
  if (allTags.length === 0) return null;

  return (
    <div className="tag-filter">
      <div className="tag-filter-header">
        <span className="tag-filter-title">태그로 필터링</span>
        {selectedTags.length > 0 && (
          <button className="clear-all-btn" onClick={onClearAll}>
            전체 해제
          </button>
        )}
      </div>
      <div className="tag-filter-list">
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              className={`filter-tag ${isSelected ? 'active' : ''}`}
              onClick={() => onTagToggle(tag)}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TagFilter;