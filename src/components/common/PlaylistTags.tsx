import type { Playlist } from "../../types/video";

interface PlaylistTagsProps {
  playlist: Playlist;
}

function PlaylistTags({ playlist }: PlaylistTagsProps) {
  // 태그가 하나도 없으면 아무것도 렌더링하지 않음
  if (!playlist.era && !playlist.mood && !playlist.country) {
    return null;
  }

  const tagStyle = {
    backgroundColor: "#f0f0f0",
    color: "#333",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "500"
  };

  // 모든 태그를 하나의 배열로 합치기 (쉼표로 분리된 태그들 처리)
  const allTags: string[] = [];
  
  if (playlist.era && playlist.era.trim()) {
    playlist.era.split(",").forEach(tag => {
      const trimmedTag = tag.trim();
      if (trimmedTag) allTags.push(trimmedTag);
    });
  }
  
  if (playlist.mood && playlist.mood.trim()) {
    playlist.mood.split(",").forEach(tag => {
      const trimmedTag = tag.trim();
      if (trimmedTag) allTags.push(trimmedTag);
    });
  }
  
  if (playlist.country && playlist.country.trim()) {
    playlist.country.split(",").forEach(tag => {
      const trimmedTag = tag.trim();
      if (trimmedTag) allTags.push(trimmedTag);
    });
  }

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        alignItems: "center"
      }}>
        {allTags.map((tag, index) => (
          <span key={index} style={tagStyle}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default PlaylistTags;