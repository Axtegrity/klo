export default function MonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0D1117",
          color: "#E6EDF3",
          fontFamily: "'DM Sans', sans-serif",
          overflow: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}
