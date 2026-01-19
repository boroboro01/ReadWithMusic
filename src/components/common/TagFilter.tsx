import React from "react";

interface TagCategory {
  title: string;
  tags: string[];
}

interface TagFilterProps {
  categories: TagCategory[];
  selectedTags: string[];
  onTagToggle: (tag: string, categoryTitle: string) => void;
  onClearAll: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({
  categories,
  selectedTags,
  onTagToggle,
  onClearAll,
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

        return (
          <div key={category.title} className="tag-category">
            <h4 className="tag-category-title">{category.title}</h4>
            <div className="tag-filter-list">
              {category.tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                const disabledTags = getDisabledTags(category.title);
                const isDisabled = !isSelected && disabledTags.includes(tag);

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
