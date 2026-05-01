import { useEffect, useRef, useState } from "react";

const INACTIVITY_TIME = 30 * 1000; // 🔥 30 seconds (testing)
const WARNING_TIME = 60; // 🔥 countdown

export default function useInactivityTracker(onLogout) {
  const [showPopup, setShowPopup] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_TIME);

  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // 🔊 ALERT SOUND (popup)
  const playAlertSound = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  };

  // 🔊 BEEP SOUND (last seconds)
  const playBeepSound = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  };

  const resetTimer = () => {
    clearTimeout(timerRef.current);
    clearInterval(countdownRef.current);

    setShowPopup(false);
    setCountdown(WARNING_TIME);

    timerRef.current = setTimeout(() => {
      setShowPopup(true);

      // 🔊 PLAY ALERT SOUND
      playAlertSound();

      let timeLeft = WARNING_TIME;

      countdownRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);

        // 🔊 LAST 5 SEC BEEP
        if (timeLeft <= 5 && timeLeft > 0) {
          playBeepSound();
        }

        if (timeLeft <= 0) {
          clearInterval(countdownRef.current);
          onLogout();
        }
      }, 1000);

    }, INACTIVITY_TIME);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer(); // start timer

    return () => {
      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  return { showPopup, countdown, resetTimer };
}