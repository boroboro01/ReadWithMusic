type Props = {
  children: React.ReactNode;
};

function ContentContainer({ children }: Props) {
  return (
    <div
      style={{
        margin: "0 auto",
        padding: "20px 20px",
      }}
    >
      {children}
    </div>
  );
}

export default ContentContainer;
