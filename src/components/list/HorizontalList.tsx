import { useRef } from "react";

type Props = {
  children: React.ReactNode;
};

function HorizontalList({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -240, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" });
  };

  return (
    <div className="horizontal-wrapper">
      <button className="scroll-nav left" onClick={scrollLeft}>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button className="scroll-nav right" onClick={scrollRight}>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* 스크롤 영역 */}
      <div ref={scrollRef} className="horizontal-scroll">
        {children}
      </div>
    </div>
  );
}

export default HorizontalList;
