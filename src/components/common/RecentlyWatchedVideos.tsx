import React, { useEffect, useState, useMemo } from "react";
import HorizontalList from "../list/HorizontalList";
import VideoCard from "../card/VideoCard";
import type { Video } from "../../types/video";

interface RecentlyWatchedVideosProps {
  videos: any[]; // Supabase video data
  onSelect: (video: any) => void;
  selectedVideo: Video | null;
}

interface RecentVideo {
  youtube_id: string;
  timestamp: number;
  progress?: number; // Progress percentage (0-100)
}

const RecentlyWatchedVideos: React.FC<RecentlyWatchedVideosProps> = ({
  videos,
  onSelect,
  selectedVideo,
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
