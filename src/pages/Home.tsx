import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient"; // 추가
import MainLayout from "../components/layout/MainLayout";
import ContentContainer from "../components/layout/ContentContainer";
import HorizontalList from "../components/list/HorizontalList";
import VideoCard from "../components/card/VideoCard";
import Player from "../components/Player/Player";
import PlaylistTags from "../components/common/PlaylistTags";
import TagFilter from "../components/common/TagFilter";
import type { Video } from "../types/video";
import logo from "../assets/logo.png";

// 인터페이스 정의 (Supabase 데이터 구조와 일치)
interface Playlist {
  id: string;
  title: string;
  country: string;
  era: string;
  mood: string;
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
    const countryTags = new Set<string>();

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
      parseTags(pl.country).forEach((t) => countryTags.add(t));
    });

    return [
      { title: "분위기", tags: Array.from(moodTags).sort() },
      { title: "시대", tags: Array.from(eraTags).sort() },
      { title: "국가", tags: Array.from(countryTags).sort() },
    ];
  }, [playlists]); // playlists가 바뀔 때만 재계산

  // 4. 태그 필터링 로직 (filteredPlaylists)
  const filteredPlaylists = useMemo(() => {
    if (selectedTags.length === 0) return playlists;

    return playlists.filter((pl) => {
      // pl.country 등이 null일 경우를 대비해 빈 문자열("")로 치환 후 split 합니다.
      const plTags = [
        ...(pl.country || "").split(","),
        ...(pl.era || "").split(","),
        ...(pl.mood || "").split(","),
      ].map((t) => t.trim());

      return selectedTags.some((tag) => plTags.includes(tag));
    });
  }, [selectedTags, playlists]);

  // 나머지 핸들러 (동일)
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
          marginBottom: "40px",
          backgroundColor: "#191919",
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

      <ContentContainer>
        <TagFilter
          categories={tagCategories}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClearAll={() => setSelectedTags([])}
        />
      </ContentContainer>

      {filteredPlaylists.map((playlist) => {
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
                country={playlist.country}
                era={playlist.era}
                mood={playlist.mood}
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
      })}
      <Player selectedVideo={selectedVideo} />
    </MainLayout>
  );
}

export default Home;
