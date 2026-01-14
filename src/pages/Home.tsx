import { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import ContentContainer from "../components/layout/ContentContainer";
import HorizontalList from "../components/list/HorizontalList";
import VideoCard from "../components/card/VideoCard";
import Player from "../components/Player/Player";
import type { Video } from "../types/video";

const mockVideos = [
  {
    youtubeId: "MYPVQccHhAQ",
    title:
      "4K Cozy Coffee Shop with Smooth Piano Jazz Music for Relaxing, Studying and Working",
    author: "Relaxing Jazz Piano",
    duration: "3:35:22",
  },
  {
    youtubeId: "nv_2rz5BFDA",
    title: "Just Thinking...Retro Jazz",
    author: "Pause,maybe?",
    duration: "2:54:00",
  },
  {
    youtubeId: "3SGNtFQ1v3M",
    title: "Chill Jazz 🎼 Smooth Jazz Music",
    author: "Jazzip",
    duration: "3:17:52",
  },
  {
    youtubeId: "8zr_bWR8Yk4",
    title:
      "Charming Fall Jazz in Cozy Outdoor Café 🍂 Soft Jazz Music for Working, Reading, Study",
    author: "Cozy Outdoor Jazz",
    duration: "3:14:02",
  },
  {
    youtubeId: "U9Ji1RoA4hk",
    title:
      "🦃 Snoopy Thanksgiving Jazz ☕ Cozy Holiday Music for Gratitude and Good Vibes 🍂",
    author: "EASE JAZZ",
    duration: "1:07:30",
  },
  {
    youtubeId: "0FEVmjeS6XM",
    title:
      "DISNEY 50 Jazz Covers from Disney Classics ☕ BGM Music for Studying & Working",
    author: "Massiomo Roberti",
    duration: "2:42:41",
  },
  {
    youtubeId: "y7gfL33XA70",
    title:
      "BGM The Beatles in JAZZ 30 Greatest Hits - Relaxing Guitar Music for Studying, Working, Running",
    author: "Massiomo Roberti",
    duration: "1:33:39",
  },
  {
    youtubeId: "ecAR5gVCRmE",
    title: "Playlist | 픽사, 재즈",
    author: "JazzNe",
    duration: "10:08:05",
  },
  {
    youtubeId: "ziOus5-1kXw",
    title: "coulou's vinyl cafe (no. 1) - jazz selections",
    author: "COULOU",
    duration: "1:22:54",
  },
  {
    youtubeId: "nQdjlkBF9rM",
    title: "Jazz Night｜Soul-Jazz & Jazz-Funk Vinyl Set",
    author: "見本盤Mihon Reko",
    duration: "00:36:26",
  },
  {
    youtubeId: "7lq6e4Lu4B8",
    title: "Playlist | 지브리, 재즈 | GHIBLI Jazz",
    author: "JazzNe",
    duration: "10:37:30",
  },
  {
    youtubeId: "3C01eaL5_Xw",
    title: "I Love You | 60's - 70's Rhythm and Soul Playlist",
    author: "MISTAH CEE",
    duration: "00:46:14",
  },
];

function Home() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const handleSelect = (v: {
    youtubeId: string;
    title: string;
    author: string;
    duration: string;
  }) => {
    const thumbnail = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
    setSelectedVideo({
      id: v.youtubeId,
      title: v.title,
      author: v.author,
      duration: v.duration,
      thumbnail,
    });
  };

  return (
    <MainLayout>
      <ContentContainer>
        <h1 className="page-title">어느 책이든 어울리는 잔잔한 재즈</h1>
      </ContentContainer>

      <div style={{ padding: "0 20px 32px" }}>
        <HorizontalList>
          {mockVideos.map((v) => (
            <VideoCard
              key={v.youtubeId}
              youtubeId={v.youtubeId}
              title={v.title}
              author={v.author}
              duration={v.duration}
              onSelect={() => handleSelect(v)}
              isSelected={selectedVideo?.id === v.youtubeId}
            />
          ))}
        </HorizontalList>
      </div>

      {/* Player fixed to bottom; appears when `selectedVideo` is non-null */}
      <Player
        selectedVideo={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </MainLayout>
  );
}

export default Home;
