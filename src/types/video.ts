export interface Video {
  id: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  playlist_id: string; // Changed from playlistIds to playlistId to match JSON
}

export interface Playlist {
  id: string;
  title: string;
  country?: string;
  era?: string;
  mood?: string;
  targetBooks?: string;
}
