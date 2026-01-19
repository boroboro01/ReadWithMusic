import logo from "../../assets/logo.png";

interface HeaderProps {
  hasHovered: boolean;
  setHasHovered: (value: boolean) => void;
  showTooltip: boolean;
  setShowTooltip: (value: boolean) => void;
}

function Header({
  hasHovered,
  setHasHovered,
  showTooltip,
  setShowTooltip,
}: HeaderProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: "rgba(15, 15, 15, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "16px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "0 40px",
        }}
      >
        {/* Logo */}
        <img
          className="header-logo"
          src={logo}
          alt="독서 모드 로고"
          style={{
            height: "36px",
            width: "auto",
          }}
        />

        {/* Feedback Button */}
        <div style={{ position: "relative" }}>
          <button
            className="feedback-button"
            style={{
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #374151",
              borderRadius: "6px",
              color: "#e5e7eb",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.backgroundColor = "#374151";
              target.style.borderColor = "#6b7280";
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.backgroundColor = "transparent";
              target.style.borderColor = "#374151";
              if (!hasHovered) {
                setHasHovered(true);
                setShowTooltip(false);
              }
            }}
            onClick={() => {
              // 의견 남기기 폼을 새 창에서 열기
              window.open("https://tally.so/r/GxpAk2", "_blank");
            }}
          >
            의견 남기기
          </button>
          {showTooltip && !hasHovered && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: "0",
                backgroundColor: "#2a2a2a",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                zIndex: 1000,
                opacity: 1,
                animation: "fadeIn 0.2s ease",
                textAlign: "right",
              }}
            >
              의견을 남겨주시면 기프티콘을 드려요 ☺️
              <div
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "12px",
                  width: 0,
                  height: 0,
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderBottom: "4px solid #2a2a2a",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
