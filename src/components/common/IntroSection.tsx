import React, { useMemo } from "react";

interface IntroSectionProps {}

const IntroSection: React.FC<IntroSectionProps> = () => {
  // public/intro 폴더의 이미지들을 사용 (1.jpg ~ 10.jpg)
  const backgroundThumbnails = useMemo(() => {
    const imageNumbers = Array.from({ length: 10 }, (_, i) => i + 1);
    const images = imageNumbers.map((num) => ({
      id: `intro-${num}`,
      src: `/intro/${num}.jpg`,
    }));

    // 애니메이션을 위해 두 배로 늘려서 무한 루프 효과
    return [...images, ...images];
  }, []);

  return (
    <div className="intro-section">
      {/* 배경 썸네일 애니메이션 */}
      <div className="intro-bg-container">
        <div className="intro-thumbnails">
          {backgroundThumbnails.map((image, index) => (
            <div key={`${image.id}-${index}`} className="intro-thumbnail">
              <img src={image.src} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      {/* 메인 텍스트 */}
      <div className="intro-content">
        <h1 className="intro-title">독서 분위기는 음악으로 부터</h1>
        <p className="intro-subtitle">
          책과 음악이 어우러지는 특별한 공간에 오신 것을 환영합니다.
        </p>
      </div>
    </div>
  );
};

export default IntroSection;
