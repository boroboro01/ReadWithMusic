import React from "react";

interface TagCategory {
  title: string;
  tags: string[];
}

interface TagFilterProps {
  categories: TagCategory[];
  selectedTags: string[];
  availableTags: string[];
  onTagToggle: (tag: string, categoryTitle: string) => void;
  onClearAll: () => void;
  onClearCategory: (categoryTitle: string) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({
  categories,
  selectedTags,
  availableTags,
  onTagToggle,
  onClearAll,
  onClearCategory,
}) => {
  // 분위기 태그 상호 배타 관계 정의
  const moodExclusiveMap = {
    "#밝은": ["#어두운", "#공포", "#긴장되는"],
    "#어두운": ["#밝은"],
    "#공포": ["#밝은"],
    "#긴장되는": ["#밝은"],
    "#차분한": ["#웅장한", "#활기찬"],
    "#웅장한": ["#차분한"],
    "#활기찬": ["#차분한"],
  };

  // 현재 선택된 태그들로 인해 비활성화되어야 하는 태그들 계산
  const getDisabledTags = (categoryTitle: string): string[] => {
    if (categoryTitle !== "분위기") return [];

    const disabledTags: string[] = [];
    selectedTags.forEach((selectedTag) => {
      const excludedByThis =
        moodExclusiveMap[selectedTag as keyof typeof moodExclusiveMap] || [];
      disabledTags.push(...excludedByThis);
    });

    return disabledTags;
  };
  const hasAnyTags = categories.some((category) => category.tags.length > 0);
  if (!hasAnyTags) return null;

  return (
    <div className="tag-filter">
      <div className="tag-filter-header">
        <span className="tag-filter-title">어떤 책을 읽으시나요?</span>
        {selectedTags.length > 0 && (
          <button className="clear-all-btn" onClick={onClearAll}>
            전체 해제
          </button>
        )}
      </div>

      {categories.map((category) => {
        if (category.tags.length === 0) return null;

        // 현재 카테고리에서 선택된 태그들 찾기
        const selectedTagsInCategory = selectedTags.filter(tag => 
          category.tags.includes(tag)
        );

        return (
          <div key={category.title} className="tag-category">
            <div className="tag-category-header" style={{ 
              display: "flex", 
              justifyContent: "flex-start", 
              alignItems: "center",
              marginBottom: "8px",
              gap: "8px"
            }}>
              <h4 className="tag-category-title" style={{ margin: 0 }}>{category.title}</h4>
              {selectedTagsInCategory.length > 0 && (
                <button 
                  className="clear-category-btn" 
                  onClick={() => onClearCategory(category.title)}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "rgba(255, 255, 255, 0.7)",
                    padding: "2px 6px",
                    fontSize: "0.7rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                  }}
                >
                  해제
                </button>
              )}
            </div>
            <div className="tag-filter-list">
              {category.tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                const disabledTags = getDisabledTags(category.title);
                const isMoodDisabled =
                  !isSelected && disabledTags.includes(tag);
                const isNotAvailable =
                  !isSelected && !availableTags.includes(tag);
                const isDisabled = isMoodDisabled || isNotAvailable;

                return (
                  <button
                    key={tag}
                    className={`filter-tag ${isSelected ? "active" : ""} ${
                      isDisabled ? "disabled" : ""
                    }`}
                    onClick={() =>
                      !isDisabled && onTagToggle(tag, category.title)
                    }
                    disabled={isDisabled}
                    style={{
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
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
