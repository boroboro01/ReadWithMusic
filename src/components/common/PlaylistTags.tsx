import React from "react";

interface PlaylistTagsProps {
  genre?: string;
  era?: string;
  mood?: string;
  conditions?: string;
}

const PlaylistTags: React.FC<PlaylistTagsProps> = ({
  genre,
  era,
  mood,
  conditions,
}) => {
  const parseTags = (tagString: string): string[] => {
    if (!tagString || tagString.trim() === "") return [];
    return tagString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  const genreTags = parseTags(genre || "");
  const eraTags = parseTags(era || "");
  const moodTags = parseTags(mood || "");
  const conditionTags = parseTags(conditions || "");

  const allTags = [...genreTags, ...eraTags, ...moodTags, ...conditionTags];

  if (allTags.length === 0) return null;

  return (
    <div className="playlist-tags">
      {allTags.map((tag, index) => (
        <span key={index} className="playlist-tag">
          {tag}
        </span>
      ))}
    </div>
  );
};

export default PlaylistTags;
