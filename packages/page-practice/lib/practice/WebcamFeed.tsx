import { webcam } from "@keybr/textinput-events/lib/webcam.ts";
import { type ReactNode, useEffect, useRef } from "react";
import * as styles from "./WebcamFeed.module.less";

export function WebcamFeed(): ReactNode {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;
    webcam.video = videoElement;

    async function getWebcam() {
      try {
        console.log("Requesting webcam access...");
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }

    void getWebcam();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      webcam.video = null;
    };
  }, []);

  return (
    <video
      id="webcam"
      ref={videoRef}
      autoPlay={true}
      playsInline={true}
      muted={true}
      className={styles.root}
    />
  );
}
