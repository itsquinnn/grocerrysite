import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function TopLoader() {
  const isLoading = useRouterState({
    select: (s) => s.status === "pending" || s.isLoading,
  });
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;

    if (isLoading) {
      setVisible(true);
      setProgress(25);
      t1 = setTimeout(() => setProgress(65), 150);
      t2 = setTimeout(() => setProgress(88), 400);
    } else {
      setProgress(100);
      t3 = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isLoading]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 right-0 z-[9999] h-[2px] overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary shadow-[0_0_8px_rgba(15,23,42,0.4)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

