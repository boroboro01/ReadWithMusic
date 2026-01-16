type Props = {
  children: React.ReactNode;
};

function MainLayout({ children }: Props) {
  return (
    <div
      style={{
        backgroundColor: "#343434",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}

export default MainLayout;
