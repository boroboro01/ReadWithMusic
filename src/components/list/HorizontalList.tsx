import { useRef, useState, useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

function HorizontalList({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const updateArrowVisibility = () => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;

    // 왼쪽 화살표: 스크롤이 시작 위치가 아닐 때 표시
    const canScrollLeft = scrollLeft > 0;

    // 오른쪽 화살표: 스크롤이 끝까지 가지 않았을 때 표시
    const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;

    // 호버 중이 아닐 때만 화살표 상태 업데이트
    if (!isHovering) {
      setShowLeftArrow(canScrollLeft);
      setShowRightArrow(canScrollRight);
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    // 호버 시작할 때 현재 스크롤 위치에 따라 화살표 상태 설정
    updateArrowVisibility();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // 호버 종료 시 실제 스크롤 위치에 따라 화살표 상태 업데이트
    setTimeout(() => updateArrowVisibility(), 0);
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // 초기 상태 설정
    updateArrowVisibility();

    // 스크롤 이벤트 리스너 추가
    element.addEventListener("scroll", updateArrowVisibility);

    // 리사이즈 이벤트도 감지 (화면 크기 변경 시)
    window.addEventListener("resize", updateArrowVisibility);

    return () => {
      element.removeEventListener("scroll", updateArrowVisibility);
      window.removeEventListener("resize", updateArrowVisibility);
    };
  }, [children, isHovering]); // isHovering 상태도 의존성에 추가

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -312, behavior: "smooth" }); // 약 1개 카드 분량 (296px + 16px gap)
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 312, behavior: "smooth" }); // 약 1개 카드 분량 (296px + 16px gap)
  };

  return (
    <div
      ref={wrapperRef}
      className="horizontal-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showLeftArrow && (
        <button className="scroll-nav left" onClick={scrollLeft}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {showRightArrow && (
        <button className="scroll-nav right" onClick={scrollRight}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}

      {/* 스크롤 영역 */}
      <div ref={scrollRef} className="horizontal-scroll">
        {children}
      </div>
    </div>
  );
}

export default HorizontalList;
