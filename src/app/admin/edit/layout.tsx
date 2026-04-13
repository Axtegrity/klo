// Route-scoped layout for /admin/edit.
//
// The root layout's <main> applies 72px paddingTop to clear the global TopNav.
// The HomeEditor renders its own fixed EditorTopBar (56px, z-[100]) which sits
// over that TopNav — the 72px clearance is redundant and creates a 128px dead
// zone at the top of the editor. This wrapper pulls the content back up by
// exactly 72px so it starts right below the 56px EditorTopBar.

export default function AdminEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: "-72px" }}>
      {children}
    </div>
  );
}
