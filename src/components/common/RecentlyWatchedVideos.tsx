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
      .map((recent) =>
        videos.find((video) => video.youtube_id === recent.youtube_id),
      )
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
        {recentVideoData.map((video) => (
          <VideoCard
            key={video.youtube_id}
            youtubeId={video.youtube_id}
            title={video.title}
            author={video.author}
            duration={video.duration}
            isSelected={selectedVideo?.id === video.youtube_id}
            onSelect={() => onSelect(video)}
          />
        ))}
      </HorizontalList>
    </section>
  );
};

export default RecentlyWatchedVideos;
