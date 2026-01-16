export interface Video {
  id: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  youtube_id: string;
  playlist_id: string;
}

export interface Playlist {
  id: string;
  title: string;
  country?: string;
  era?: string;
  mood?: string;
  target_books?: string;
}
