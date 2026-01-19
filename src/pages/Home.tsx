import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient"; // 추가
import MainLayout from "../components/layout/MainLayout";
import ContentContainer from "../components/layout/ContentContainer";
import HorizontalList from "../components/list/HorizontalList";
import VideoCard from "../components/card/VideoCard";
import Player from "../components/Player/Player";
import PlaylistTags from "../components/common/PlaylistTags";
import TagFilter from "../components/common/TagFilter";
import IntroSection from "../components/common/IntroSection";
import type { Video } from "../types/video";
import logo from "../assets/logo.png";
import "../styles/intro.css";

// 인터페이스 정의 (Supabase 데이터 구조와 일치)
interface Playlist {
  id: string;
  title: string;
  genre: string;
  era: string;
  mood: string;
  conditions: string;
  target_books: string;
}

function Home() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
    const eraTags = new Set<string>();
    const genreTags = new Set<string>();
    const conditionTags = new Set<string>();

    const parseTags = (tagString: string): string[] => {
      if (!tagString || tagString.trim() === "") return [];
      return tagString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.startsWith("#"));
    };

    playlists.forEach((pl) => {
      parseTags(pl.mood).forEach((t) => moodTags.add(t));
      parseTags(pl.era).forEach((t) => eraTags.add(t));
      parseTags(pl.genre).forEach((t) => genreTags.add(t));
      parseTags(pl.conditions || "").forEach((t) => conditionTags.add(t));
    });

    // 시대 태그 커스텀 정렬 (고대 → 중세 → 근대 → 현대 → 미래 순)
    const eraOrder = ["#고대", "#중세", "#근대", "#현대", "#미래"];
    const sortedEraTags = Array.from(eraTags).sort((a, b) => {
      const indexA = eraOrder.indexOf(a);
      const indexB = eraOrder.indexOf(b);

      // 둘 다 정의된 순서에 있는 경우
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // 하나만 정의된 순서에 있는 경우
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // 둘 다 정의된 순서에 없는 경우 알파벳 순
      return a.localeCompare(b);
    });

    return [
      { title: "분위기", tags: Array.from(moodTags).sort() },
      { title: "시대", tags: sortedEraTags },
      { title: "장르", tags: Array.from(genreTags).sort() },
      { title: "환경", tags: Array.from(conditionTags).sort() },
    ];
  }, [playlists]); // playlists가 바뀔 때만 재계산

  // 4. 태그 필터링 로직 (filteredPlaylists)
  const filteredPlaylists = useMemo(() => {
    if (selectedTags.length === 0) return playlists;

    return playlists.filter((pl) => {
      // pl.genre 등이 null일 경우를 대비해 빈 문자열("")로 치환 후 split 합니다.
      const plTags = [
        ...(pl.genre || "").split(","),
        ...(pl.era || "").split(","),
        ...(pl.mood || "").split(","),
        ...(pl.conditions || "").split(","),
      ].map((t) => t.trim());

      // 선택한 모든 태그가 플레이리스트에 포함되어야 함 (AND 조건)
      return selectedTags.every((tag) => plTags.includes(tag));
    });
  }, [selectedTags, playlists]);

  // 나머지 핸들러 (동일)
  const handleTagToggle = (tag: string, categoryTitle: string) => {
    setSelectedTags((prev) => {
      if (categoryTitle === "분위기" || categoryTitle === "환경") {
        // 분위기와 환경은 복수 선택 가능 (기존 로직)
        return prev.includes(tag)
          ? prev.filter((t) => t !== tag)
          : [...prev, tag];
      } else {
        // 시대와 장르는 단일 선택
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
  };

  if (loading)
    return (
      <div style={{ color: "white", padding: "20px" }}>데이터 로딩 중...</div>
    );

  return (
    <MainLayout>
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "24px 0px 24px 60px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
      >
        <img
          src={logo}
          alt="독서 모드 로고"
          style={{
            height: "36px",
            width: "auto",
          }}
        />
      </header>

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
                <h2
                  className="page-title"
                  style={{ fontSize: "1.5rem", marginBottom: "8px" }}
                >
                  {playlist.title}
                </h2>
                <PlaylistTags
                  genre={playlist.genre}
                  era={playlist.era}
                  mood={playlist.mood}
                  conditions={playlist.conditions}
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
      <Player selectedVideo={selectedVideo} />
    </MainLayout>
  );
}

export default Home;
