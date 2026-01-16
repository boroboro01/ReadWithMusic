import React, { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import type { YouTubeProps } from "react-youtube";
import "../../styles/player.css";
import type { Video } from "../../types/video";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeHigh,
  faVolumeLow,
  faVolumeXmark,
} from "@fortawesome/free-solid-svg-icons";

type Props = {
  selectedVideo: Video | null;
  // onClose 제거
};

// props에서 onClose 제거
const Player: React.FC<Props> = ({ selectedVideo }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [volume, setVolume] = useState<number>(60);
  const [muted, setMuted] = useState<boolean>(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        return;
      }
      if (!selectedVideo) return;
      e.preventDefault();
      if (!playerRef.current) {
        setPendingPlay(true);
        setIsExpanded(true);
        return;
      }
      if (isPlaying) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedVideo, isPlaying]);

  useEffect(() => {
    if (selectedVideo) {
      setPendingPlay(true);
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(selectedVideo.id);
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  }, [selectedVideo]);

  const onReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
    try {
      if (playerRef.current && playerRef.current.setVolume) {
        playerRef.current.setVolume(volume);
      }
      if (muted && playerRef.current?.mute) playerRef.current.mute();
      else if (!muted && playerRef.current?.unMute) playerRef.current.unMute();
    } catch (e) {}

    if (pendingPlay && playerRef.current && playerRef.current.playVideo) {
      try {
        playerRef.current.playVideo();
        setIsPlaying(true);
      } catch (e) {}
      setPendingPlay(false);
    }
  };

  const onStateChange: YouTubeProps["onStateChange"] = (event) => {
    const state = event.data;
    if (state === 1) setIsPlaying(true);
    if (state === 2 || state === 0) setIsPlaying(false);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) {
      setPendingPlay(true);
      setIsExpanded(true);
      return;
    }
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const onVolumeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const v = Math.max(0, Math.min(100, Number(e.target.value)));
    setVolume(v);
    if (playerRef.current?.setVolume) {
      try {
        playerRef.current.setVolume(v);
      } catch {}
    }
    if (muted && v > 0) {
      playerRef.current?.unMute?.();
      setMuted(false);
    }
  };

  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (playerRef.current.setVolume) playerRef.current.setVolume(volume);
      if (muted) playerRef.current.mute?.();
      else playerRef.current.unMute?.();
    } catch {}
  }, [volume, muted]);

  if (!selectedVideo) {
    return <div className="player-container hidden" />;
  }

  return (
    <div
      className={`player-container visible ${isExpanded ? "expanded" : "mini"}`}
      onClick={() => {
        if (!isExpanded) setIsExpanded(true);
      }}
    >
      <div
        className="mini-bar"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
      >
        <img src={selectedVideo.thumbnail} alt="thumb" className="thumb" />
        <div className="meta">
          <div className="title">{selectedVideo.title}</div>
          <div className="author">{selectedVideo.author}</div>
        </div>
        <div className="mini-right">
          <div className="mini-controls" onClick={(e) => e.stopPropagation()}>
            <FontAwesomeIcon
              className="volume-icon"
              icon={
                muted || volume === 0
                  ? faVolumeXmark
                  : volume < 50
                  ? faVolumeLow
                  : faVolumeHigh
              }
            />
            <input
              className="volume-slider"
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={onVolumeInput}
            />
          </div>
          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? "❚❚" : "▶"}
          </button>
        </div>
      </div>

      <div className="player-full" onClick={(e) => e.stopPropagation()}>
        <div className="collapse-handle" aria-hidden />
        <div className="player-header">
          <div className="video-info">
            <h3 className="full-title">{selectedVideo.title}</h3>
            <div className="full-sub">
              {selectedVideo.author} • {selectedVideo.duration}
            </div>
          </div>
        </div>

        <div className="youtube-wrapper">
          <YouTube
            videoId={selectedVideo.id}
            opts={{
              width: "100%",
              height: "60vh",
              playerVars: {
                autoplay: 1,
                rel: 0,
                modestbranding: 1,
              },
            }}
            onReady={onReady}
            onStateChange={onStateChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Player;
