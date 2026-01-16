type Props = {
  children: React.ReactNode;
};

function MainLayout({ children }: Props) {
  return (
    <div
      style={{
        backgroundColor: "#0f0f0f",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}

export default MainLayout;
