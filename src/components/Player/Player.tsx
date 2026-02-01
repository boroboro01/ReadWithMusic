import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const progressIntervalRef = useRef<number | null>(null);

  // Function to update video progress in localStorage
  const updateVideoProgress = useCallback(
    (youtubeId: string, currentTime: number, duration: number) => {
      if (duration <= 0) return; // Avoid division by zero

      const progress = Math.round((currentTime / duration) * 100);

      try {
        const stored = localStorage.getItem("recent_videos");
        if (!stored) return;

        let recentVideos = JSON.parse(stored);
        const videoIndex = recentVideos.findIndex(
          (item: any) => item.youtube_id === youtubeId,
        );

        if (videoIndex !== -1) {
          recentVideos[videoIndex].progress = Math.min(progress, 100);
          recentVideos[videoIndex].lastTimestamp = currentTime; // Save exact timestamp in seconds
          localStorage.setItem("recent_videos", JSON.stringify(recentVideos));
        }
      } catch (error) {
        console.error("Failed to update video progress:", error);
      }
    },
    [],
  );

  // Function to get stored timestamp for a video
  const getStoredTimestamp = useCallback((youtubeId: string): number => {
    try {
      const stored = localStorage.getItem("recent_videos");
      if (!stored) return 0;

      const recentVideos = JSON.parse(stored);
      const video = recentVideos.find(
        (item: any) => item.youtube_id === youtubeId,
      );

      return video?.lastTimestamp || 0;
    } catch (error) {
      console.error("Failed to get stored timestamp:", error);
      return 0;
    }
  }, []);

  // Function to start progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && selectedVideo && isPlaying) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();

          if (currentTime && duration && duration > 0) {
            updateVideoProgress(selectedVideo.id, currentTime, duration);
          }
        } catch (error) {
          console.error("Error tracking progress:", error);
        }
      }
    }, 5000); // Update every 5 seconds
  }, [selectedVideo, isPlaying, updateVideoProgress]);

  // Function to stop progress tracking
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

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
          // 새로운 영상 로드 시에만 확장 상태에 따라 자동 재생 결정
          if (isExpanded) {
            playerRef.current.playVideo();
            setIsPlaying(true);
          }
        } catch (error) {
          console.error("YouTube Player load error:", error);
        }
      }
    }
  }, [selectedVideo?.id]); // isExpanded 제거 - 비디오 ID 변경 시에만 로드

  // 미니플레이어/확장 상태 변경 시 영상 재생/일시정지 제어
  useEffect(() => {
    if (!playerRef.current || !selectedVideo) return;

    try {
      if (isExpanded) {
        // 확장 시: 이전에 재생 중이었다면 계속 재생
        // pendingPlay는 새 영상 로드 시에만 사용하므로 여기서는 isPlaying 상태만 확인
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } else {
        // 축소 시: 재생 중이면 일시정지만 (영상 위치는 유지)
        if (isPlaying) {
          playerRef.current.pauseVideo();
          // 재생 상태는 유지해서 다시 확장할 때 재생을 계속할 수 있도록 함
        }
      }
    } catch (error) {
      console.error("Player control error:", error);
    }
  }, [isExpanded]);

  // Effect to manage progress tracking based on playing state
  useEffect(() => {
    if (isPlaying && selectedVideo && isExpanded) {
      startProgressTracking();
    } else {
      stopProgressTracking();
    }

    // Cleanup on unmount
    return () => {
      stopProgressTracking();
    };
  }, [
    isPlaying,
    selectedVideo,
    isExpanded,
    startProgressTracking,
    stopProgressTracking,
  ]);

  const onReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
    try {
      if (playerRef.current && playerRef.current.setVolume) {
        playerRef.current.setVolume(volume);
      }
      if (muted && playerRef.current?.mute) playerRef.current.mute();
      else if (!muted && playerRef.current?.unMute) playerRef.current.unMute();
    } catch (e) {}

    // Resume playback from stored timestamp
    if (selectedVideo && playerRef.current) {
      const storedTimestamp = getStoredTimestamp(selectedVideo.id);

      if (storedTimestamp > 0) {
        try {
          // Seek to stored position
          playerRef.current.seekTo(storedTimestamp, true);
        } catch (error) {
          console.error("Failed to seek to stored timestamp:", error);
        }
      }
    }

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

    if (state === 1) {
      setIsPlaying(true);
      // Start progress tracking when video starts playing
      if (selectedVideo && isExpanded) {
        startProgressTracking();
      }
    }
    if (state === 2) {
      setIsPlaying(false);
      // Stop progress tracking when video is paused
      stopProgressTracking();
    }
    if (state === 0 && selectedVideo) {
      // Video ended - update progress to 100% and clear timestamp
      stopProgressTracking();
      try {
        const stored = localStorage.getItem("recent_videos");
        if (stored) {
          let recentVideos = JSON.parse(stored);
          const videoIndex = recentVideos.findIndex(
            (item: any) => item.youtube_id === selectedVideo.id,
          );

          if (videoIndex !== -1) {
            recentVideos[videoIndex].progress = 100;
            recentVideos[videoIndex].lastTimestamp = 0; // Clear timestamp when video is completed
            localStorage.setItem("recent_videos", JSON.stringify(recentVideos));
          }
        }
      } catch (error) {
        console.error("Failed to update completion status:", error);
      }
    }

    // 아래에 있던 state === 0 관련 if문과 setTimeout을 통째로 삭제하세요.
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 미니플레이어 상태에서는 재생/일시정지 불가 (유튜브 정책 준수)
    if (!isExpanded) {
      onExpandedChange(true); // 대신 플레이어 확장
      return;
    }

    if (!playerRef.current) {
      setPendingPlay(true);
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
            className={`nav-btn prev-btn ${!isExpanded ? "disabled" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isExpanded) {
                onExpandedChange(true);
                return;
              }
              if (onPrevious) onPrevious();
            }}
            title={!isExpanded ? "플레이어를 확장하여 사용" : "이전 곡"}
          >
            <FontAwesomeIcon icon={faStepBackward} />
          </button>

          <button
            className={`play-btn ${!isExpanded ? "disabled" : ""}`}
            onClick={togglePlay}
            title={
              !isExpanded
                ? "플레이어를 확장하여 재생"
                : isPlaying
                  ? "일시정지"
                  : "재생"
            }
          >
            {!isExpanded ? "▶" : isPlaying ? "❚❚" : "▶"}
          </button>

          <button
            className={`nav-btn next-btn ${!isExpanded ? "disabled" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isExpanded) {
                onExpandedChange(true);
                return;
              }
              if (onNext) onNext();
            }}
            title={!isExpanded ? "플레이어를 확장하여 사용" : "다음 곡"}
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

        <div className="policy-notice">
          본 서비스는 YouTube API 가이드라인을 준수하여 운영됩니다
          <br />
          따라서 영상은 확장된 플레이어 상태에서만 재생이 가능합니다
        </div>
      </div>
    </div>
  );
};

export default React.memo(Player);
