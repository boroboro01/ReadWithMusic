import React from "react";

interface PlaylistTagsProps {
  genre?: string;
  mood?: string;
  conditions?: string;
  music?: string;
}

const PlaylistTags: React.FC<PlaylistTagsProps> = ({
  genre,
  mood,
  conditions,
  music,
}) => {
  const parseTags = (tagString: string): string[] => {
    if (!tagString || tagString.trim() === "") return [];
    return tagString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  const genreTags = parseTags(genre || "");
  const moodTags = parseTags(mood || "");
  const conditionTags = parseTags(conditions || "");
  const musicTags = parseTags(music || "");

  const allTags = [...genreTags, ...moodTags, ...conditionTags, ...musicTags];

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
