import { useEffect } from 'react';

export function useVisibleVideo(videoRef) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let visible = false;
    const updatePlayback = () => {
      if (visible && !document.hidden) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    }, { threshold: 0.01 });
    observer.observe(video);
    document.addEventListener('visibilitychange', updatePlayback);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, [videoRef]);
}
