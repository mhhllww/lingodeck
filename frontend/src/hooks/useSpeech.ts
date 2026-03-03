import { useCallback, useEffect, useRef, useState } from 'react';

export function useSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const speak = useCallback(
    (text: string, lang = 'en-US') => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang === 'en-US' || v.lang === 'en-GB'
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
