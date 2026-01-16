import { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import ContentContainer from "../components/layout/ContentContainer";
import HorizontalList from "../components/list/HorizontalList";
import VideoCard from "../components/card/VideoCard";
import Player from "../components/Player/Player";
import type { Video } from "../types/video";
import logo from "../assets/logo.png";

// 1. 통합 데이터 가져오기
import videoData from "../data/videoData.json";

function Home() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

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

      {/* 2. 모든 플레이리스트를 순회하며 렌더링 */}
      {videoData.playlists.map((playlist) => {
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
                style={{ fontSize: "1.5rem", marginBottom: "16px" }}
              >
                {playlist.title}
              </h2>
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
