/*
  App Router template — re-mounts on every route change.
  This gives us smooth fade+slide transitions between workspace modules.
*/
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: "workspaceFadeIn 0.28s ease-out both" }}>
      {children}
    </div>
  );
}
