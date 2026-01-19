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

    const parseTags = (tagString: string): string[] => {
      if (!tagString || tagString.trim() === "") return [];
      return tagString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.startsWith("#"));
    };

    playlists.forEach((pl) => {
      parseTags(pl.mood).forEach((t) => moodTags.add(t));
      parseTags(pl.genre).forEach((t) => genreTags.add(t));
      parseTags(pl.conditions || "").forEach((t) => conditionTags.add(t));
      parseTags(pl.music || "").forEach((t) => musicTags.add(t));
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

    return [
      { title: "분위기", tags: sortedMoodTags },
      { title: "장르", tags: Array.from(genreTags).sort() },
      { title: "환경", tags: Array.from(conditionTags).sort() },
      { title: "음악", tags: Array.from(musicTags).sort() },
    ];
  }, [playlists]); // playlists가 바뀔 때만 재계산

  // 4. 태그 필터링 로직 (filteredPlaylists)
  const filteredPlaylists = useMemo(() => {
    if (selectedTags.length === 0) return playlists;

    return playlists.filter((pl) => {
      // pl.genre 등이 null일 경우를 대비해 빈 문자열("")로 치환 후 split 합니다.
      const plTags = [
        ...(pl.genre || "").split(","),
        ...(pl.mood || "").split(","),
        ...(pl.conditions || "").split(","),
        ...(pl.music || "").split(","),
      ].map((t) => t.trim());

      // 선택한 모든 태그가 플레이리스트에 포함되어야 함 (AND 조건)
      return selectedTags.every((tag) => plTags.includes(tag));
    });
  }, [selectedTags, playlists]);

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
  };

  // 다음 영상 재생 함수
  const playNextVideo = useCallback(() => {
    setSelectedVideo((current) => {
      // 1. 현재 재생 중인 영상이 없으면 아무것도 안 함
      if (!current) return null;

      // 2. 현재 영상이 속한 플레이리스트의 비디오들 필터링
      const currentPlaylistVideos = videos.filter(
        (v) => v.playlist_id === current.playlist_id
      );

      if (currentPlaylistVideos.length === 0) return current;

      // 3. 현재 인덱스 찾기
      const currentIndex = currentPlaylistVideos.findIndex(
        (v) => v.youtube_id === current.id
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
        (v) => v.playlist_id === current.playlist_id
      );

      if (currentPlaylistVideos.length === 0) return current;

      const currentIndex = currentPlaylistVideos.findIndex(
        (v) => v.youtube_id === current.id
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
          onTagToggle={handleTagToggle}
          onClearAll={() => setSelectedTags([])}
        />
      </ContentContainer>

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
          // 비디오 상태에서 필터링
          const filteredVideos = videos.filter(
            (v) => v.playlist_id === playlist.id
          );
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
