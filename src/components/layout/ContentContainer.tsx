type Props = {
  children: React.ReactNode;
};

function ContentContainer({ children }: Props) {
  return (
    <div
      style={{
        margin: "0 auto",
        padding: "0px 0px 12px 60px",
      }}
    >
      {children}
    </div>
  );
}

export default ContentContainer;
