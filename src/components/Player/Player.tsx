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
  faExpand,
  faCompress,
  faStepBackward,
  faStepForward,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  selectedVideo: Video | null;
  onVideoEnd?: () => void;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

const Player = (props: Props) => {
  const {
    selectedVideo,
    onVideoEnd,
    isExpanded,
    onExpandedChange,
    onPrevious,
    onNext,
  } = props;

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
        onExpandedChange(true);
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

      // playerRef.current가 존재하는지, 그리고 로드 함수가 있는지 엄격하게 체크
      if (
        playerRef.current &&
        typeof playerRef.current.loadVideoById === "function"
      ) {
        try {
          // 내부 에러를 방지하기 위해 try-catch로 감싸고 호출
          playerRef.current.loadVideoById(selectedVideo.id);
          playerRef.current.playVideo();
          setIsPlaying(true);
        } catch (error) {
          console.error("YouTube Player load error:", error);
        }
      }
    }
  }, [selectedVideo?.id]); // id가 바뀔 때만 실행되도록 수정

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
    if (state === 2) setIsPlaying(false);

    // 아래에 있던 state === 0 관련 if문과 setTimeout을 통째로 삭제하세요.
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) {
      setPendingPlay(true);
      onExpandedChange(true);
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
        if (!isExpanded) onExpandedChange(true);
      }}
    >
      <div
        className={`mini-bar ${!isExpanded ? "mini-bar-hoverable" : ""}`}
        title={
          !isExpanded ? "클릭하여 플레이어 확장" : "클릭하여 플레이어 축소"
        }
        onClick={(e) => {
          e.stopPropagation();
          onExpandedChange(!isExpanded);
        }}
      >
        <img src={selectedVideo.thumbnail} alt="thumb" className="thumb" />
        <div className="meta">
          <div className="title">{selectedVideo.title}</div>
          <div className="author">{selectedVideo.author}</div>
        </div>

        {/* 중앙 재생 컨트롤 */}
        <div className="mini-center">
          <button
            className="nav-btn prev-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onPrevious) onPrevious();
            }}
            title="이전 곡"
          >
            <FontAwesomeIcon icon={faStepBackward} />
          </button>

          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <button
            className="nav-btn next-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onNext) onNext();
            }}
            title="다음 곡"
          >
            <FontAwesomeIcon icon={faStepForward} />
          </button>
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
          {/* 맨 오른쪽 확장/축소 버튼 */}
          <button
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              onExpandedChange(!isExpanded);
            }}
            title={isExpanded ? "축소" : "확장"}
          >
            <FontAwesomeIcon icon={isExpanded ? faCompress : faExpand} />
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
            onEnd={() => {
              if (onVideoEnd) {
                onVideoEnd(); // Home의 playNextVideo를 여기서 딱 한 번만 호출
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(Player);
