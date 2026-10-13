/**
 * Directory backdrop: slow aurora ribbons + a drifting halftone field, all CSS transforms (GPU-friendly).
 * Distinct from the landing constellation so each page has its own atmosphere.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden data-testid="aurora-background" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      <div className="halftone" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0c0a12_95%)]" />
    </div>
  );
}
