import { type ReactNode,useEffect, useRef } from "react";
import * as styles from "./WebcamFeed.module.less";

export function WebcamFeed(): ReactNode {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function getWebcam() {
      try {
        console.log("Requesting webcam access...");
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }

    void getWebcam();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return <video id="webcam" ref={videoRef} autoPlay playsInline muted className={styles.root} />;
}
