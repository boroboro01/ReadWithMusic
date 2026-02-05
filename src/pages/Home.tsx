import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabaseClient"; // 추가
import MainLayout from "../components/layout/MainLayout";
import Header from "../components/layout/Header";
import ContentContainer from "../components/layout/ContentContainer";
import HorizontalList from "../components/list/HorizontalList";
import VideoCard from "../components/card/VideoCard";
import Player from "../components/Player/Player";
import PlaylistTags from "../components/common/PlaylistTags";
import TagFilter from "../components/common/TagFilter";
import IntroSection from "../components/common/IntroSection";
import RecentlyWatchedVideos from "../components/common/RecentlyWatchedVideos";
import type { Video } from "../types/video";
import "../styles/intro.css";

// 인터페이스 정의 (Supabase 데이터 구조와 일치)
interface Playlist {
  id: string;
  title: string;
  genre: string;
  mood: string;
  conditions: string;
  music: string;
  target_books: string;
}

function Home() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false); // 플레이어 확장 상태 관리
  const [showTooltip, setShowTooltip] = useState(true); // 툴팁 상태 관리 - 기본적으로 표시
  const [hasHovered, setHasHovered] = useState(false); // 한 번이라도 호버했는지 여부

  // 1. Supabase에서 받아올 상태값 설정
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. 데이터 페칭 함수
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 플레이리스트와 비디오를 동시에 가져옴
      const [plRes, vidRes] = await Promise.all([
        supabase
          .from("playlists")
          .select("*")
          .order("display_order", { ascending: true })
          .order("title", { ascending: true }),
        supabase.from("videos").select("*"),
      ]);

      if (plRes.error || vidRes.error) {
        console.error("데이터 로드 실패:", plRes.error || vidRes.error);
      } else {
        setPlaylists(plRes.data || []);
        setVideos(vidRes.data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // 3. 태그 카테고리 추출 (이제 videoData 대신 playlists 상태 사용)
  const tagCategories = useMemo(() => {
    const moodTags = new Set<string>();
    const genreTags = new Set<string>();
    const conditionTags = new Set<string>();
    const musicTags = new Set<string>();
    const durationTags = new Set<string>();

    const parseTags = (tagString: string): string[] => {
      if (!tagString || tagString.trim() === "") return [];
      return tagString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.startsWith("#"));
    };

    // Parse duration string (e.g., "1:23:45" or "45:30") to minutes
    const parseDurationToMinutes = (duration: string): number => {
      if (!duration) return 0;
      const parts = duration.split(":").map(Number);
      if (parts.length === 3) {
        // Format: "H:MM:SS"
        return parts[0] * 60 + parts[1] + parts[2] / 60;
      } else if (parts.length === 2) {
        // Format: "MM:SS"
        return parts[0] + parts[1] / 60;
      }
      return 0;
    };

    // Get duration category tag for a video
    const getDurationTag = (duration: string): string => {
      const minutes = parseDurationToMinutes(duration);
      const hours = minutes / 60;

      if (hours <= 1) return "#-1시간";
      else if (hours <= 2) return "#1-2시간";
      else if (hours <= 3) return "#2-3시간";
      else return "#3시간+";
    };

    playlists.forEach((pl) => {
      parseTags(pl.mood).forEach((t) => moodTags.add(t));
      parseTags(pl.genre).forEach((t) => genreTags.add(t));
      parseTags(pl.conditions || "").forEach((t) => conditionTags.add(t));
      parseTags(pl.music || "").forEach((t) => musicTags.add(t));
    });

    // Add duration tags based on videos in each playlist
    playlists.forEach((playlist) => {
      const playlistVideos = videos.filter(
        (v) => v.playlist_id === playlist.id,
      );
      playlistVideos.forEach((video) => {
        const durationTag = getDurationTag(video.duration);
        durationTags.add(durationTag);
      });
    });

    // 분위기 태그 커스텀 정렬 (차분한, 밝은 앞쪽, 공포 맨 뒤)
    const moodPriorityOrder = ["#차분한", "#밝은"];
    const moodLastOrder = ["#공포"];
    const sortedMoodTags = Array.from(moodTags).sort((a, b) => {
      const priorityA = moodPriorityOrder.indexOf(a);
      const priorityB = moodPriorityOrder.indexOf(b);
      const lastA = moodLastOrder.indexOf(a);
      const lastB = moodLastOrder.indexOf(b);

      // 우선순위 태그들 처리
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB;
      }
      if (priorityA !== -1) return -1;
      if (priorityB !== -1) return 1;

      // 마지막 순서 태그들 처리
      if (lastA !== -1 && lastB !== -1) {
        return lastA - lastB;
      }
      if (lastA !== -1) return 1;
      if (lastB !== -1) return -1;

      // 나머지는 알파벳 순
      return a.localeCompare(b);
    });

    // Duration tags custom order
    const durationOrder = ["#-1시간", "#1-2시간", "#2-3시간", "#3시간+"];
    const sortedDurationTags = Array.from(durationTags).sort((a, b) => {
      const indexA = durationOrder.indexOf(a);
      const indexB = durationOrder.indexOf(b);
      return indexA - indexB;
    });

    return [
      { title: "분위기", tags: sortedMoodTags },
      { title: "장르", tags: Array.from(genreTags).sort() },
      { title: "환경", tags: Array.from(conditionTags).sort() },
      { title: "음악", tags: Array.from(musicTags).sort() },
      { title: "시간", tags: sortedDurationTags },
    ];
  }, [playlists, videos]); // videos 의존성 추가

  // Helper function to get available tags based on current selection
  const getAvailableTags = useCallback(
    (currentSelectedTags: string[]) => {
      const availableTags = new Set<string>();

      // Helper functions for duration parsing (reused from above)
      const parseDurationToMinutes = (duration: string): number => {
        if (!duration) return 0;
        const parts = duration.split(":").map(Number);
        if (parts.length === 3) {
          return parts[0] * 60 + parts[1] + parts[2] / 60;
        } else if (parts.length === 2) {
          return parts[0] + parts[1] / 60;
        }
        return 0;
      };

      const getDurationTag = (duration: string): string => {
        const minutes = parseDurationToMinutes(duration);
        const hours = minutes / 60;

        if (hours <= 1) return "#-1시간";
        else if (hours <= 2) return "#1-2시간";
        else if (hours <= 3) return "#2-3시간";
        else return "#3시간+";
      };

      const parseTags = (tagString: string): string[] => {
        if (!tagString || tagString.trim() === "") return [];
        return tagString
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.startsWith("#"));
      };

      // If no tags are selected, all tags are available
      if (currentSelectedTags.length === 0) {
        // Add all playlist tags
        playlists.forEach((pl) => {
          parseTags(pl.mood).forEach((t) => availableTags.add(t));
          parseTags(pl.genre).forEach((t) => availableTags.add(t));
          parseTags(pl.conditions || "").forEach((t) => availableTags.add(t));
          parseTags(pl.music || "").forEach((t) => availableTags.add(t));
        });

        // Add all duration tags
        videos.forEach((video) => {
          const durationTag = getDurationTag(video.duration);
          availableTags.add(durationTag);
        });

        return Array.from(availableTags);
      }

      // Separate duration and non-duration tags
      const selectedDurationTags = currentSelectedTags.filter(
        (tag) =>
          tag.includes("-1시간") ||
          tag.includes("1-2시간") ||
          tag.includes("2-3시간") ||
          tag.includes("3시간+"),
      );
      const selectedNonDurationTags = currentSelectedTags.filter(
        (tag) => !selectedDurationTags.includes(tag),
      );

      // Filter videos based on current selection
      let filteredVideos = videos;

      // Apply duration filtering if duration tags are selected
      if (selectedDurationTags.length > 0) {
        filteredVideos = filteredVideos.filter((video) => {
          const videoDurationTag = getDurationTag(video.duration);
          return selectedDurationTags.includes(videoDurationTag);
        });
      }

      // Apply non-duration tag filtering
      if (selectedNonDurationTags.length > 0) {
        const filteredPlaylistIds = playlists
          .filter((pl) => {
            const plTags = [
              ...(pl.genre || "").split(","),
              ...(pl.mood || "").split(","),
              ...(pl.conditions || "").split(","),
              ...(pl.music || "").split(","),
            ].map((t) => t.trim());

            return selectedNonDurationTags.every((tag) => plTags.includes(tag));
          })
          .map((pl) => pl.id);

        filteredVideos = filteredVideos.filter((video) =>
          filteredPlaylistIds.includes(video.playlist_id),
        );
      }

      // Get unique playlist IDs from filtered videos
      const filteredPlaylistIds = [
        ...new Set(filteredVideos.map((v) => v.playlist_id)),
      ];

      // Collect all tags from filtered playlists
      const filteredPlaylists = playlists.filter((pl) =>
        filteredPlaylistIds.includes(pl.id),
      );
      filteredPlaylists.forEach((pl) => {
        parseTags(pl.mood).forEach((t) => availableTags.add(t));
        parseTags(pl.genre).forEach((t) => availableTags.add(t));
        parseTags(pl.conditions || "").forEach((t) => availableTags.add(t));
        parseTags(pl.music || "").forEach((t) => availableTags.add(t));
      });

      // Collect duration tags from filtered videos
      filteredVideos.forEach((video) => {
        const durationTag = getDurationTag(video.duration);
        availableTags.add(durationTag);
      });

      return Array.from(availableTags);
    },
    [playlists, videos],
  );

  // Get available tags based on current selection
  const availableTags = useMemo(
    () => getAvailableTags(selectedTags),
    [getAvailableTags, selectedTags],
  );

  // 4. 태그 필터링 로직 (filteredPlaylists)
  const filteredPlaylists = useMemo(() => {
    if (selectedTags.length === 0) return playlists;

    // Helper function to parse duration and get category tag
    const parseDurationToMinutes = (duration: string): number => {
      if (!duration) return 0;
      const parts = duration.split(":").map(Number);
      if (parts.length === 3) {
        return parts[0] * 60 + parts[1] + parts[2] / 60;
      } else if (parts.length === 2) {
        return parts[0] + parts[1] / 60;
      }
      return 0;
    };

    const getDurationTag = (duration: string): string => {
      const minutes = parseDurationToMinutes(duration);
      const hours = minutes / 60;

      if (hours <= 1) return "#-1시간";
      else if (hours <= 2) return "#1-2시간";
      else if (hours <= 3) return "#2-3시간";
      else return "#3시간+";
    };

    return playlists.filter((pl) => {
      // Regular playlist tags
      const plTags = [
        ...(pl.genre || "").split(","),
        ...(pl.mood || "").split(","),
        ...(pl.conditions || "").split(","),
        ...(pl.music || "").split(","),
      ].map((t) => t.trim());

      // Check if any selected tags are duration tags
      const selectedDurationTags = selectedTags.filter(
        (tag) =>
          tag.includes("-1시간") ||
          tag.includes("1-2시간") ||
          tag.includes("2-3시간") ||
          tag.includes("3시간+"),
      );
      const selectedNonDurationTags = selectedTags.filter(
        (tag) => !selectedDurationTags.includes(tag),
      );

      // Check regular tags (non-duration)
      const regularTagsMatch =
        selectedNonDurationTags.length === 0 ||
        selectedNonDurationTags.every((tag) => plTags.includes(tag));

      // Check duration tags
      let durationTagsMatch = true;
      if (selectedDurationTags.length > 0) {
        const playlistVideos = videos.filter((v) => v.playlist_id === pl.id);

        // For duration filtering, check if ANY video in the playlist matches the duration criteria
        durationTagsMatch = selectedDurationTags.every((selectedDurationTag) =>
          playlistVideos.some((video) => {
            const videoDurationTag = getDurationTag(video.duration);
            return videoDurationTag === selectedDurationTag;
          }),
        );
      }

      return regularTagsMatch && durationTagsMatch;
    });
  }, [selectedTags, playlists, videos]);

  // 나머지 핸들러 (동일)
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

  const handleTagToggle = (tag: string, categoryTitle: string) => {
    setSelectedTags((prev) => {
      if (categoryTitle === "분위기") {
        // 분위기 태그의 상호 배타 로직
        if (prev.includes(tag)) {
          // 태그 해제
          return prev.filter((t) => t !== tag);
        } else {
          // 새 태그 선택 - 상호 배타적인 태그들 제거
          const excludedTags =
            moodExclusiveMap[tag as keyof typeof moodExclusiveMap] || [];
          const filteredPrev = prev.filter((t) => !excludedTags.includes(t));
          return [...filteredPrev, tag];
        }
      } else if (categoryTitle === "환경") {
        // 환경은 복수 선택 가능 (기존 로직)
        return prev.includes(tag)
          ? prev.filter((t) => t !== tag)
          : [...prev, tag];
      } else if (categoryTitle === "시간") {
        // 시간은 단일 선택 (한 번에 하나의 시간 범위만)
        const durationTags =
          tagCategories.find((cat) => cat.title === "시간")?.tags || [];

        if (prev.includes(tag)) {
          // 이미 선택된 태그를 클릭하면 해제
          return prev.filter((t) => t !== tag);
        } else {
          // 새로운 태그를 선택하면 같은 카테고리의 다른 태그들은 제거하고 새 태그 추가
          return [...prev.filter((t) => !durationTags.includes(t)), tag];
        }
      } else {
        // 장르, 음악은 단일 선택
        const categoryTags =
          tagCategories.find((cat) => cat.title === categoryTitle)?.tags || [];

        if (prev.includes(tag)) {
          // 이미 선택된 태그를 클릭하면 해제
          return prev.filter((t) => t !== tag);
        } else {
          // 새로운 태그를 선택하면 같은 카테고리의 다른 태그들은 제거하고 새 태그 추가
          return [...prev.filter((t) => !categoryTags.includes(t)), tag];
        }
      }
    });
  };

  // 특정 카테고리의 선택된 태그들을 모두 해제하는 함수
  const handleClearCategory = (categoryTitle: string) => {
    setSelectedTags((prev) => {
      const categoryTags =
        tagCategories.find((cat) => cat.title === categoryTitle)?.tags || [];
      // 해당 카테고리에 속하지 않는 태그들만 유지
      return prev.filter((tag) => !categoryTags.includes(tag));
    });
  };

  const handleSelect = (v: any) => {
    setSelectedVideo({
      id: v.youtube_id,
      title: v.title,
      author: v.author,
      duration: v.duration,
      thumbnail: `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`,
      playlist_id: v.playlist_id,
    });
    // 처음 영상 클릭 시 플레이어를 확장된 상태로 표시
    setIsPlayerExpanded(true);

    // Save to localStorage for recently watched
    try {
      const stored = localStorage.getItem("recent_videos");
      let recentVideos = stored ? JSON.parse(stored) : [];

      // Find existing video entry
      const existingVideoIndex = recentVideos.findIndex(
        (item: any) => item.youtube_id === v.youtube_id,
      );

      let recentVideo;
      if (existingVideoIndex !== -1) {
        // Video exists, preserve existing progress and lastTimestamp, update timestamp
        recentVideo = {
          ...recentVideos[existingVideoIndex],
          timestamp: Date.now(), // Update access time
        };
        // Remove existing entry
        recentVideos = recentVideos.filter(
          (item: any) => item.youtube_id !== v.youtube_id,
        );
      } else {
        // New video entry
        recentVideo = {
          youtube_id: v.youtube_id,
          timestamp: Date.now(),
          progress: 0,
          lastTimestamp: 0,
        };
      }

      // Add to beginning
      recentVideos.unshift(recentVideo);

      // Keep only last 20 items
      recentVideos = recentVideos.slice(0, 20);

      localStorage.setItem("recent_videos", JSON.stringify(recentVideos));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };

  // 다음 영상 재생 함수
  const playNextVideo = useCallback(() => {
    setSelectedVideo((current) => {
      // 1. 현재 재생 중인 영상이 없으면 아무것도 안 함
      if (!current) return null;

      // 2. 현재 영상이 속한 플레이리스트의 비디오들 필터링
      const currentPlaylistVideos = videos.filter(
        (v) => v.playlist_id === current.playlist_id,
      );

      if (currentPlaylistVideos.length === 0) return current;

      // 3. 현재 인덱스 찾기
      const currentIndex = currentPlaylistVideos.findIndex(
        (v) => v.youtube_id === current.id,
      );

      // 4. 다음 인덱스 계산 (마지막이면 처음으로)
      const nextIndex = (currentIndex + 1) % currentPlaylistVideos.length;
      const nextVideo = currentPlaylistVideos[nextIndex];

      // 5. 새로운 Video 객체 반환 (타입 정의에 맞춰서)
      return {
        id: nextVideo.youtube_id,
        title: nextVideo.title,
        author: nextVideo.author,
        duration: nextVideo.duration,
        thumbnail: `https://img.youtube.com/vi/${nextVideo.youtube_id}/hqdefault.jpg`,
        playlist_id: nextVideo.playlist_id,
      };
    });
  }, [videos]); // videos 데이터가 변경될 때만 함수 갱신

  // 이전 영상 재생 함수
  const playPreviousVideo = useCallback(() => {
    setSelectedVideo((current) => {
      if (!current) return null;

      const currentPlaylistVideos = videos.filter(
        (v) => v.playlist_id === current.playlist_id,
      );

      if (currentPlaylistVideos.length === 0) return current;

      const currentIndex = currentPlaylistVideos.findIndex(
        (v) => v.youtube_id === current.id,
      );

      // 이전 인덱스 계산 (첫 번째면 마지막으로)
      const prevIndex =
        currentIndex === 0
          ? currentPlaylistVideos.length - 1
          : currentIndex - 1;
      const prevVideo = currentPlaylistVideos[prevIndex];

      return {
        id: prevVideo.youtube_id,
        title: prevVideo.title,
        author: prevVideo.author,
        duration: prevVideo.duration,
        thumbnail: `https://img.youtube.com/vi/${prevVideo.youtube_id}/hqdefault.jpg`,
        playlist_id: prevVideo.playlist_id,
      };
    });
  }, [videos]);

  // 다음 영상 재생 함수 (수동 호출용)
  const playNext = useCallback(() => {
    playNextVideo();
  }, [playNextVideo]);

  if (loading)
    return (
      <div style={{ color: "white", padding: "20px" }}>데이터 로딩 중...</div>
    );

  return (
    <MainLayout>
      <Header
        hasHovered={hasHovered}
        setHasHovered={setHasHovered}
        showTooltip={showTooltip}
        setShowTooltip={setShowTooltip}
      />

      <IntroSection />

      <ContentContainer>
        <TagFilter
          categories={tagCategories}
          selectedTags={selectedTags}
          availableTags={availableTags}
          onTagToggle={handleTagToggle}
          onClearAll={() => setSelectedTags([])}
          onClearCategory={handleClearCategory}
        />
        {/* Search Result Count - Show when tags are selected */}
        {selectedTags.length > 0 && (
          <div className="search-result-count">
            총 검색 결과{" "}
            <span className="count-number">{filteredPlaylists.length}</span>개
          </div>
        )}
      </ContentContainer>

      {/* Recently Watched Section - Hide when tags are selected */}
      {selectedTags.length === 0 && (
        <ContentContainer>
          <div className="content-transition">
            <RecentlyWatchedVideos videos={videos} onSelect={handleSelect} />
          </div>
        </ContentContainer>
      )}

      {selectedTags.length > 0 && filteredPlaylists.length === 0 ? (
        <ContentContainer>
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>😵</div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#e5e7eb",
                marginBottom: "8px",
              }}
            >
              선택하신 조건에 맞는 플레이리스트가 없습니다
            </h3>
            <p style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>
              다른 태그 조합을 시도해보시거나 일부 태그를 해제해보세요
            </p>
          </div>
        </ContentContainer>
      ) : (
        filteredPlaylists.map((playlist) => {
          // Helper functions for duration filtering
          const parseDurationToMinutes = (duration: string): number => {
            if (!duration) return 0;
            const parts = duration.split(":").map(Number);
            if (parts.length === 3) {
              return parts[0] * 60 + parts[1] + parts[2] / 60;
            } else if (parts.length === 2) {
              return parts[0] + parts[1] / 60;
            }
            return 0;
          };

          const getDurationTag = (duration: string): string => {
            const minutes = parseDurationToMinutes(duration);
            const hours = minutes / 60;

            if (hours <= 1) return "#-1시간";
            else if (hours <= 2) return "#1-2시간";
            else if (hours <= 3) return "#2-3시간";
            else return "#3시간+";
          };

          // Get videos for this playlist
          let filteredVideos = videos.filter(
            (v) => v.playlist_id === playlist.id,
          );

          // Apply duration filtering if duration tags are selected
          const selectedDurationTags = selectedTags.filter(
            (tag) =>
              tag.includes("-1시간") ||
              tag.includes("1-2시간") ||
              tag.includes("2-3시간") ||
              tag.includes("3시간+"),
          );

          if (selectedDurationTags.length > 0) {
            filteredVideos = filteredVideos.filter((video) => {
              const videoDurationTag = getDurationTag(video.duration);
              return selectedDurationTags.includes(videoDurationTag);
            });
          }

          if (filteredVideos.length === 0) return null;

          return (
            <section key={playlist.id} style={{ marginBottom: "20px" }}>
              <ContentContainer>
                <h2 className="page-title" style={{ marginBottom: "8px" }}>
                  {playlist.title}
                </h2>
                <PlaylistTags
                  genre={playlist.genre}
                  mood={playlist.mood}
                  conditions={playlist.conditions}
                  music={playlist.music}
                />
              </ContentContainer>

              <ContentContainer>
                <HorizontalList>
                  {filteredVideos.map((v) => (
                    <VideoCard
                      key={v.youtube_id}
                      youtubeId={v.youtube_id}
                      title={v.title}
                      author={v.author}
                      duration={v.duration}
                      isSelected={selectedVideo?.id === v.youtube_id}
                      onSelect={() => handleSelect(v)}
                    />
                  ))}
                </HorizontalList>
              </ContentContainer>
            </section>
          );
        })
      )}

      <Player
        selectedVideo={selectedVideo}
        onVideoEnd={playNextVideo}
        isExpanded={isPlayerExpanded}
        onExpandedChange={setIsPlayerExpanded}
        onPrevious={playPreviousVideo}
        onNext={playNext}
      />

      <footer
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          borderTop: "1px solid #374151",
          padding: "24px 0",
          marginTop: "80px",
          marginBottom: selectedVideo ? "70px" : "0",
          textAlign: "center",
        }}
      >
        <div
          className="footer-text"
          style={{
            color: "#9ca3af",
            letterSpacing: "1.5px",
            lineHeight: "1.6",
          }}
        >
          © 2026 ReadWithMusic. All rights reserved.
          <br />본 서비스는 YouTube API 가이드라인을 준수하여 운영됩니다.
          <br />
          사이트 내 임베딩된 모든 영상의 저작권 및 광고 수익에 대한 권리는 각
          영상의 원저작자(YouTube 채널 소유자)에게 있습니다.
          <br />본 서비스는 영상의 직접적인 복제나 다운로드 기능을 제공하지
          않습니다.
        </div>
      </footer>
    </MainLayout>
  );
}

export default Home;
