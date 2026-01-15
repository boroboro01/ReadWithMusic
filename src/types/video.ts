export interface Video {
  id: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  playlistIds: string[]; // 중요: 이 영상이 속한 플리 ID 목록
}

export interface Playlist {
  id: string;
  title: string;
  country?: string;
  era?: string;
  mood?: string;
  targetBooks?: string;
}
