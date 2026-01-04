import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  initialSeconds: number;
  onExpire: () => void;
}

export const CountdownTimer = ({ initialSeconds, onExpire }: CountdownTimerProps) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onExpire]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    if (seconds > 300) return 'text-success';
    if (seconds > 60) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <svg className="w-5 h-5 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`text-sm font-medium ${getColorClass()}`}>
        Кодът изтича след: {formatTime(seconds)}
      </span>
    </div>
  );
};