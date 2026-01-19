type Props = {
  children: React.ReactNode;
};

function ContentContainer({ children }: Props) {
  return (
    <div
      style={{
        margin: "0 auto",
        padding: "0px 0px 6px 60px",
      }}
      className="content-container"
    >
      {children}
    </div>
  );
}

export default ContentContainer;
