import React, { useEffect, useRef, useState, useCallback } from "react";
import YouTube from "react-youtube";
import type { YouTubeProps } from "react-youtube";
import "../../styles/player.css";
import type { Video } from "../../types/video";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import rainSound from "../../assets/ambient/rain.wav";
import fireplaceSound from "../../assets/ambient/fireplace.mp3";
import cafeSound from "../../assets/ambient/cafe.mp3";
import {
  faVolumeHigh,
  faVolumeLow,
  faVolumeXmark,
  faExpand,
  faCompress,
  faStepBackward,
  faStepForward,
  faHome,
  faCloudRain,
  faFire,
  faCoffee,
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
  const [activeSounds, setActiveSounds] = useState<{
    rain: boolean;
    fire: boolean;
    cafe: boolean;
  }>({ rain: false, fire: false, cafe: false });
  const [soundVolumes, setSoundVolumes] = useState<{
    rain: number;
    fire: number;
    cafe: number;
  }>({ rain: 30, fire: 30, cafe: 30 });
  const [sliderHover, setSliderHover] = useState<{
    main: boolean;
    rain: boolean;
    fire: boolean;
    cafe: boolean;
  }>({ main: false, rain: false, fire: false, cafe: false });
  const [audioRefs] = useState<{
    rain: HTMLAudioElement | null;
    fire: HTMLAudioElement | null;
    cafe: HTMLAudioElement | null;
  }>({ rain: null, fire: null, cafe: null });
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

  // 사운드 토글 함수들
  const toggleSound = (
    soundType: "rain" | "fire" | "cafe",
    audioUrl: string,
  ) => {
    const currentAudio = audioRefs[soundType];

    if (activeSounds[soundType]) {
      // 현재 재생 중이면 정지
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      setActiveSounds((prev) => ({ ...prev, [soundType]: false }));
    } else {
      // 재생 시작
      if (currentAudio) {
        currentAudio.volume = soundVolumes[soundType] / 100;
        currentAudio.currentTime = 0; // 처음부터 재생
        currentAudio.play().catch(console.error);
      } else {
        const newAudio = new Audio(audioUrl);
        newAudio.loop = true; // 자동 반복 설정
        newAudio.volume = soundVolumes[soundType] / 100;

        // ended 이벤트 리스너 추가 - 더 확실한 반복 재생을 위해
        newAudio.addEventListener("ended", () => {
          if (activeSounds[soundType]) {
            newAudio.currentTime = 0;
            newAudio.play().catch(console.error);
          }
        });

        // 오류 발생 시 이벤트 리스너
        newAudio.addEventListener("error", (e) => {
          console.error(`오디오 재생 오류 (${soundType}):`, e);
        });

        audioRefs[soundType] = newAudio;
        newAudio.play().catch(console.error);
      }
      setActiveSounds((prev) => ({ ...prev, [soundType]: true }));
    }
  };

  // 사운드 볼륨 조절 함수
  const updateSoundVolume = (
    soundType: "rain" | "fire" | "cafe",
    volume: number,
  ) => {
    setSoundVolumes((prev) => ({ ...prev, [soundType]: volume }));
    const currentAudio = audioRefs[soundType];
    if (currentAudio) {
      currentAudio.volume = volume / 100;
    }
  };

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
              onMouseEnter={() =>
                setSliderHover((prev) => ({ ...prev, main: true }))
              }
              onMouseLeave={() =>
                setSliderHover((prev) => ({ ...prev, main: false }))
              }
              style={{
                background: `linear-gradient(to right, ${sliderHover.main ? "#ffffff" : "#d1d1d1"} 0%, ${sliderHover.main ? "#ffffff" : "#d1d1d1"} ${muted ? 0 : volume}%, rgba(255,255,255,0.2) ${muted ? 0 : volume}%, rgba(255,255,255,0.2) 100%)`,
                WebkitAppearance: "none",
                appearance: "none",
                outline: "none",
                borderRadius: "2px",
                cursor: "pointer",
              }}
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

        {/* 좌측 사이드바 버튼들 */}
        <div
          style={{
            position: "absolute",
            left: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            zIndex: 10,
          }}
        >
          {/* 네비게이션 그룹 */}
          <button
            onClick={() => {
              onExpandedChange(false);
            }}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              backdropFilter: "blur(20px) saturate(180%)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 32px rgba(0, 0, 0, 0.12)";
            }}
            title="홈으로 돌아가기 - 플레이어를 닫고 메인 화면으로 이동합니다"
          >
            <FontAwesomeIcon icon={faHome} size="sm" />
          </button>

          {/* 구분선 */}
          <div
            style={{
              width: "40px",
              height: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              margin: "0",
            }}
          />

          {/* 앰비언트 사운드 그룹 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => toggleSound("rain", rainSound)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: activeSounds.rain
                  ? "rgba(59, 130, 246, 0.3)"
                  : "rgba(255, 255, 255, 0.15)",
                border: activeSounds.rain
                  ? "1px solid rgba(59, 130, 246, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                color: activeSounds.rain ? "#7dd3fc" : "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                backdropFilter: "blur(20px) saturate(180%)",
                boxShadow: activeSounds.rain
                  ? "0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "0 8px 32px rgba(0, 0, 0, 0.12)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = activeSounds.rain
                  ? "rgba(59, 130, 246, 0.4)"
                  : "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = activeSounds.rain
                  ? "rgba(59, 130, 246, 0.3)"
                  : "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              title={
                activeSounds.rain
                  ? "비 소리 끄기 - 현재 재생 중"
                  : "비 소리 켜기 - 집중에 도움이 되는 빗소리"
              }
            >
              <FontAwesomeIcon icon={faCloudRain} size="sm" />
            </button>

            <input
              className="volume-slider"
              type="range"
              min="0"
              max="100"
              value={soundVolumes.rain}
              onChange={(e) =>
                updateSoundVolume("rain", parseInt(e.target.value))
              }
              onMouseEnter={() =>
                setSliderHover((prev) => ({ ...prev, rain: true }))
              }
              onMouseLeave={() =>
                setSliderHover((prev) => ({ ...prev, rain: false }))
              }
              style={{
                width: "60px",
                height: "4px",
                background: `linear-gradient(to right, ${sliderHover.rain ? "#ffffff" : "#d1d1d1"} 0%, ${sliderHover.rain ? "#ffffff" : "#d1d1d1"} ${soundVolumes.rain}%, rgba(255,255,255,0.2) ${soundVolumes.rain}%, rgba(255,255,255,0.2) 100%)`,
                WebkitAppearance: "none",
                appearance: "none",
                outline: "none",
                borderRadius: "2px",
                cursor: "pointer",
              }}
              title={`비 소리 음량: ${soundVolumes.rain}%`}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => toggleSound("fire", fireplaceSound)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: activeSounds.fire
                  ? "rgba(251, 146, 60, 0.3)"
                  : "rgba(255, 255, 255, 0.15)",
                border: activeSounds.fire
                  ? "1px solid rgba(251, 146, 60, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                color: activeSounds.fire ? "#fdba74" : "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                backdropFilter: "blur(20px) saturate(180%)",
                boxShadow: activeSounds.fire
                  ? "0 8px 32px rgba(251, 146, 60, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "0 8px 32px rgba(0, 0, 0, 0.12)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = activeSounds.fire
                  ? "rgba(251, 146, 60, 0.4)"
                  : "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = activeSounds.fire
                  ? "rgba(251, 146, 60, 0.3)"
                  : "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              title={
                activeSounds.fire
                  ? "모닥불 소리 끄기 - 현재 재생 중"
                  : "모닥불 소리 켜기 - 따뜻하고 포근한 장작 타는 소리"
              }
            >
              <FontAwesomeIcon icon={faFire} size="sm" />
            </button>

            <input
              className="volume-slider"
              type="range"
              min="0"
              max="100"
              value={soundVolumes.fire}
              onChange={(e) =>
                updateSoundVolume("fire", parseInt(e.target.value))
              }
              onMouseEnter={() =>
                setSliderHover((prev) => ({ ...prev, fire: true }))
              }
              onMouseLeave={() =>
                setSliderHover((prev) => ({ ...prev, fire: false }))
              }
              style={{
                width: "60px",
                height: "4px",
                background: `linear-gradient(to right, ${sliderHover.fire ? "#ffffff" : "#d1d1d1"} 0%, ${sliderHover.fire ? "#ffffff" : "#d1d1d1"} ${soundVolumes.fire}%, rgba(255,255,255,0.2) ${soundVolumes.fire}%, rgba(255,255,255,0.2) 100%)`,
                WebkitAppearance: "none",
                appearance: "none",
                outline: "none",
                borderRadius: "2px",
                cursor: "pointer",
              }}
              title={`모닥불 소리 음량: ${soundVolumes.fire}%`}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => toggleSound("cafe", cafeSound)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: activeSounds.cafe
                  ? "rgba(120, 113, 108, 0.3)"
                  : "rgba(255, 255, 255, 0.15)",
                border: activeSounds.cafe
                  ? "1px solid rgba(120, 113, 108, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                color: activeSounds.cafe ? "#d6d3d1" : "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                backdropFilter: "blur(20px) saturate(180%)",
                boxShadow: activeSounds.cafe
                  ? "0 8px 32px rgba(120, 113, 108, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "0 8px 32px rgba(0, 0, 0, 0.12)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = activeSounds.cafe
                  ? "rgba(120, 113, 108, 0.4)"
                  : "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = activeSounds.cafe
                  ? "rgba(120, 113, 108, 0.3)"
                  : "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              title={
                activeSounds.cafe
                  ? "카페 소리 끄기 - 현재 재생 중"
                  : "카페 소리 켜기 - 편안한 카페 분위기 소리"
              }
            >
              <FontAwesomeIcon icon={faCoffee} size="sm" />
            </button>

            <input
              className="volume-slider"
              type="range"
              min="0"
              max="100"
              value={soundVolumes.cafe}
              onChange={(e) =>
                updateSoundVolume("cafe", parseInt(e.target.value))
              }
              onMouseEnter={() =>
                setSliderHover((prev) => ({ ...prev, cafe: true }))
              }
              onMouseLeave={() =>
                setSliderHover((prev) => ({ ...prev, cafe: false }))
              }
              style={{
                width: "60px",
                height: "4px",
                background: `linear-gradient(to right, ${sliderHover.cafe ? "#ffffff" : "#d1d1d1"} 0%, ${sliderHover.cafe ? "#ffffff" : "#d1d1d1"} ${soundVolumes.cafe}%, rgba(255,255,255,0.2) ${soundVolumes.cafe}%, rgba(255,255,255,0.2) 100%)`,
                WebkitAppearance: "none",
                appearance: "none",
                outline: "none",
                borderRadius: "2px",
                cursor: "pointer",
              }}
              title={`카페 소리 음량: ${soundVolumes.cafe}%`}
            />
          </div>
        </div>
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
