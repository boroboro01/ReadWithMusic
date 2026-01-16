import { useState, useMemo } from "react";
import MainLayout from "../components/layout/MainLayout";
import ContentContainer from "../components/layout/ContentContainer";
import HorizontalList from "../components/list/HorizontalList";
import VideoCard from "../components/card/VideoCard";
import Player from "../components/Player/Player";
import PlaylistTags from "../components/common/PlaylistTags";
import TagFilter from "../components/common/TagFilter";
import type { Video } from "../types/video";
import logo from "../assets/logo.png";

// 1. 통합 데이터 가져오기
import videoData from "../data/videoData.json";

function Home() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 카테고리별 태그 추출
  const tagCategories = useMemo(() => {
    const moodTags = new Set<string>();
    const eraTags = new Set<string>();
    const countryTags = new Set<string>();

    videoData.playlists.forEach((playlist) => {
      const parseTags = (tagString: string): string[] => {
        if (!tagString || tagString.trim() === "") return [];
        return tagString
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      };

      // 분위기 태그
      parseTags(playlist.mood || "").forEach((tag) => moodTags.add(tag));
      // 시대 태그
      parseTags(playlist.era || "").forEach((tag) => eraTags.add(tag));
      // 국가 태그
      parseTags(playlist.country || "").forEach((tag) => countryTags.add(tag));
    });

    return [
      { title: "분위기", tags: Array.from(moodTags).sort() },
      { title: "시대", tags: Array.from(eraTags).sort() },
      { title: "국가", tags: Array.from(countryTags).sort() },
    ];
  }, []);

  // 태그 필터링된 플레이리스트
  const filteredPlaylists = useMemo(() => {
    if (selectedTags.length === 0) {
      return videoData.playlists;
    }

    return videoData.playlists.filter((playlist) => {
      const parseTags = (tagString: string): string[] => {
        if (!tagString || tagString.trim() === "") return [];
        return tagString
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      };

      const playlistTags = [
        ...parseTags(playlist.country || ""),
        ...parseTags(playlist.era || ""),
        ...parseTags(playlist.mood || ""),
      ];

      return selectedTags.some((selectedTag) =>
        playlistTags.includes(selectedTag)
      );
    });
  }, [selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleClearAllTags = () => {
    setSelectedTags([]);
  };

  const handleSelect = (v: any) => {
    const youtubeId = v.youtube_id;
    const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    setSelectedVideo({
      id: youtubeId,
      title: v.title,
      author: v.author,
      duration: v.duration,
      thumbnail,
      playlist_id: v.playlist_id,
    });
  };

  return (
    <MainLayout>
      {/* 헤더 UI */}
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "12px 0 12px 20px",
          marginBottom: "40px",
          backgroundColor: "#191919",
        }}
      >
        <img
          src={logo}
          alt="독서 모드 로고"
          style={{
            height: "80px",
            width: "auto",
            marginBottom: "24px",
          }}
        />
      </header>

      {/* 태그 필터 UI */}
      <ContentContainer>
        <TagFilter
          categories={tagCategories}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClearAll={handleClearAllTags}
        />
      </ContentContainer>

      {/* 2. 필터링된 플레이리스트 렌더링 */}
      {filteredPlaylists.map((playlist) => {
        // 해당 플리에 속한 영상들만 필터링
        const filteredVideos = videoData.videos.filter(
          (v) => v.playlist_id === playlist.id
        );

        // 혹시 영상이 하나도 없는 플리는 화면에서 건너뜁니다
        if (filteredVideos.length === 0) return null;

        return (
          <section key={playlist.id} style={{ marginBottom: "40px" }}>
            <ContentContainer>
              <h2
                className="page-title"
                style={{ fontSize: "1.5rem", marginBottom: "8px" }}
              >
                {playlist.title}
              </h2>
              <PlaylistTags
                country={playlist.country}
                era={playlist.era}
                mood={playlist.mood}
              />
            </ContentContainer>

            <div style={{ padding: "0 20px" }}>
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
            </div>
          </section>
        );
      })}

      <Player selectedVideo={selectedVideo} />
    </MainLayout>
  );
}

export default Home;
