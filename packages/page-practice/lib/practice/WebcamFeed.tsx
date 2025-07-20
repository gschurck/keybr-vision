import { webcam } from "@keybr/textinput-events/lib/webcam.ts";
import { type Hand } from "@tensorflow-models/hand-pose-detection";
import { type ReactNode, useEffect, useRef } from "react";
import * as styles from "./WebcamFeed.module.less";

const fingerLookupIndices: Record<string, number[]> = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

export function WebcamFeed(): ReactNode {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    webcam.video = videoElement;

    if (!videoElement || !canvasElement) {
      return;
    }

    const ctx = canvasElement.getContext("2d");
    if (!ctx) {
      return;
    }

    const drawPoint = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
    };

    const drawPath = (
      points: { x: number; y: number }[],
      closePath: boolean,
    ) => {
      const region = new Path2D();
      region.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const point = points[i];
        region.lineTo(point.x, point.y);
      }

      if (closePath) {
        region.closePath();
      }
      ctx.stroke(region);
    };

    const drawKeypoints = (
      keypoints: { x: number; y: number }[],
      handedness: string,
    ) => {
      ctx.fillStyle = handedness === "Left" ? "Red" : "Blue";
      ctx.strokeStyle = "White";
      ctx.lineWidth = 2;

      for (const keypoint of keypoints) {
        drawPoint(keypoint.x, keypoint.y, 3);
      }

      const fingers = Object.keys(fingerLookupIndices);
      for (const finger of fingers) {
        const points = fingerLookupIndices[finger].map((idx) => keypoints[idx]);
        drawPath(points, false);
      }
    };

    const drawResults = (hands: Hand[]) => {
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      for (const hand of hands) {
        if (hand.keypoints != null) {
          drawKeypoints(hand.keypoints, hand.handedness);
        }
      }
    };

    webcam.onHandsDetected = (hands: Hand[]) => {
      drawResults(hands);
    };

    async function getWebcam() {
      try {
        console.log("Requesting webcam access...");
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.onloadedmetadata = () => {
            if (videoRef.current && canvasRef.current) {
              const videoWidth = videoRef.current.videoWidth;
              const videoHeight = videoRef.current.videoHeight;
              videoRef.current.width = videoWidth;
              videoRef.current.height = videoHeight;
              canvasRef.current.width = videoWidth;
              canvasRef.current.height = videoHeight;
              ctx.translate(videoWidth, 0);
              ctx.scale(-1, 1);
            }
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }

    void getWebcam();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      webcam.video = null;
      webcam.onHandsDetected = null;
    };
  }, []);

  return (
    <div className={styles.container}>
      <video
        id="webcam"
        ref={videoRef}
        autoPlay={true}
        playsInline={true}
        muted={true}
        className={styles.video}
      />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
