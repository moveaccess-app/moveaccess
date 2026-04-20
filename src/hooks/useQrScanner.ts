'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

export interface UseQrScannerOptions {
  /** Scanning enabled (paused when false) */
  enabled?: boolean;
  /** Scan interval in ms (default 250) */
  interval?: number;
  /** Preferred camera facing mode */
  facingMode?: 'environment' | 'user';
  /** jsQR inversion strategy */
  inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
}

export interface UseQrScannerReturn {
  /** Ref to attach to a <video> element */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Ref to attach to a hidden <canvas> for frame capture */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Last scanned QR code value */
  code: string | null;
  /** Whether the camera is active */
  streaming: boolean;
  /** Error message if camera failed */
  error: string | null;
  /** Clear the last scanned code so scanning resumes */
  reset: () => void;
}

/**
 * Hook that manages a camera stream and continuously scans for QR codes
 * using jsQR. Returns the decoded string when a QR code is detected.
 */
export function useQrScanner(options: UseQrScannerOptions = {}): UseQrScannerReturn {
  const {
    enabled = true,
    interval = 150,
    facingMode = 'environment',
    inversionAttempts = 'attemptBoth',
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [code, setCode] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCode(null);
  }, []);

  // Start / stop camera stream.
  // When `enabled` changes from true→false the cleanup runs, stopping tracks.
  // When `enabled` changes from false→true a fresh stream is created.
  useEffect(() => {
    if (!enabled) return;               // no-op; cleanup of previous run already stopped the stream

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStreaming(true);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Permissão de câmera negada. Habilite nas configurações do navegador.'
            : err instanceof DOMException && err.name === 'NotFoundError'
              ? 'Nenhuma câmera encontrada neste dispositivo.'
              : 'Não foi possível acessar a câmera.';
        setError(msg);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setStreaming(false);
    };
  }, [enabled, facingMode]);

  // Scan frames for QR codes
  useEffect(() => {
    if (!streaming || !enabled || code !== null) return;

    const timer = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts,
      });

      if (result?.data) {
        setCode(result.data);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [streaming, enabled, code, interval, inversionAttempts]);

  return { videoRef, canvasRef, code, streaming, error, reset };
}
