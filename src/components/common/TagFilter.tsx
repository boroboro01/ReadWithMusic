import React from "react";

interface TagCategory {
  title: string;
  tags: string[];
}

interface TagFilterProps {
  categories: TagCategory[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({
  categories,
  selectedTags,
  onTagToggle,
  onClearAll,
}) => {
  const hasAnyTags = categories.some((category) => category.tags.length > 0);
  if (!hasAnyTags) return null;

  return (
    <div className="tag-filter">
      <div className="tag-filter-header">
        <span className="tag-filter-title">
          원하는 태그를 골라 빠르게 찾아보세요
        </span>
        {selectedTags.length > 0 && (
          <button className="clear-all-btn" onClick={onClearAll}>
            전체 해제
          </button>
        )}
      </div>

      {categories.map((category) => {
        if (category.tags.length === 0) return null;

        return (
          <div key={category.title} className="tag-category">
            <h4 className="tag-category-title">{category.title}</h4>
            <div className="tag-filter-list">
              {category.tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    className={`filter-tag ${isSelected ? "active" : ""}`}
                    onClick={() => onTagToggle(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TagFilter;
