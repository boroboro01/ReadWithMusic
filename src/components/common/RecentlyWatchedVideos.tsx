import React, { useEffect, useState, useMemo } from "react";
import HorizontalList from "../list/HorizontalList";

interface RecentlyWatchedVideosProps {
  videos: any[]; // Supabase video data
  onSelect: (video: any) => void;
}

interface RecentVideo {
  youtube_id: string;
  timestamp: number;
  progress?: number; // Progress percentage (0-100)
}

const RecentlyWatchedVideos: React.FC<RecentlyWatchedVideosProps> = ({
  videos,
  onSelect,
}) => {
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);

  useEffect(() => {
    // Fetch recent videos from localStorage
    const stored = localStorage.getItem("recent_videos");
    if (stored) {
      try {
        const parsed: RecentVideo[] = JSON.parse(stored);
        // Sort by timestamp (newest first) and take only last 10
        const sortedRecent = parsed
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setRecentVideos(sortedRecent);
      } catch (error) {
        console.error("Failed to parse recent videos:", error);
        setRecentVideos([]);
      }
    }
  }, []);

  // Filter and map recent video IDs to actual video data
  const recentVideoData = useMemo(() => {
    if (recentVideos.length === 0) return [];

    return recentVideos
      .map((recent) => {
        const video = videos.find(
          (video) => video.youtube_id === recent.youtube_id,
        );
        if (video) {
          return {
            ...video,
            progress: recent.progress || 0, // Include progress from localStorage
          };
        }
        return null;
      })
      .filter(Boolean); // Remove undefined entries
  }, [recentVideos, videos]);

  // Handle delete function
  const handleDelete = (videoId: string, event: React.MouseEvent) => {
    // Prevent video from playing when delete button is clicked
    event.stopPropagation();

    // Show confirmation dialog
    const confirmed = window.confirm("최근 시청한 목록에서 삭제하시겠어요?");

    if (confirmed) {
      try {
        // Update localStorage
        const stored = localStorage.getItem("recent_videos");
        if (stored) {
          const parsed = JSON.parse(stored);
          const updatedVideos = parsed.filter(
            (item: any) => item.youtube_id !== videoId,
          );
          localStorage.setItem("recent_videos", JSON.stringify(updatedVideos));
        }

        // Update state to reflect the change immediately
        setRecentVideos((prev) =>
          prev.filter((video) => video.youtube_id !== videoId),
        );
      } catch (error) {
        console.error("Failed to delete video from recent list:", error);
      }
    }
  };

  // Don't render if no recent videos
  if (recentVideoData.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: "40px" }}>
      <div style={{ marginBottom: "8px" }}>
        <h2
          className="page-title"
          style={{
            marginBottom: "8px",
            color: "#e5e7eb",
            fontSize: "1.5rem",
            fontWeight: "600",
            letterSpacing: "0.5px",
          }}
        >
          최근 시청한 영상
        </h2>
        <div
          style={{
            height: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            marginBottom: "16px",
          }}
        />
      </div>

      <HorizontalList>
        {recentVideoData.map((video) => {
          const progress = video.progress || 0;
          const thumbnailUrl = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;

          return (
            <div key={video.youtube_id} className="video-card">
              {/* Custom thumbnail with progress bar */}
              <div
                className="video-thumbnail"
                style={{ position: "relative", overflow: "hidden" }}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(video)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(video);
                }}
              >
                <img src={thumbnailUrl} alt={video.title} />
                <button
                  className="video-play-btn"
                  aria-label={`Play ${video.title}`}
                >
                  ▶
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(video.youtube_id, e)}
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(220, 38, 38, 0.9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(0, 0, 0, 0.7)";
                  }}
                  aria-label={`Remove ${video.title} from recent videos`}
                >
                  ✕
                </button>

                {/* Progress bar overlay */}
                {progress > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "0",
                      left: "0",
                      right: "0",
                      height: "3px",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      pointerEvents: "none",
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: "#ff0000",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Video metadata */}
              <div className="video-meta">
                <span className="video-duration">{video.duration}</span>
                <div className="video-title">{video.title}</div>
                <div className="video-author">{video.author}</div>
              </div>
            </div>
          );
        })}
      </HorizontalList>
    </section>
  );
};

export default RecentlyWatchedVideos;
