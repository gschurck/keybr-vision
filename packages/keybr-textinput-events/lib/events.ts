import {
  createDetector,
  type HandDetector,
  SupportedModels,
} from "@tensorflow-models/hand-pose-detection";
import { getModifiers } from "./modifiers.ts";
import { type IKeyboardEvent } from "./types.ts";
import { webcam } from "./webcam.ts";

const model = SupportedModels.MediaPipeHands;
const detectorConfig = {
  runtime: "mediapipe", // or 'tfjs',
  solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
  modelType: "full",
  maxHands: 2
};

// Initialize the detector and load the image when the module loads.
// These promises will be resolved only once.
const detectorPromise: Promise<HandDetector> = createDetector(
  model,
  detectorConfig,
);

let isDetecting = false;

async function detect() {
  const video = webcam.video;
  // Prevent multiple detections from running at once, or if video is not ready.
  // readyState < 2 means the video doesn't have enough data for the current frame.
  if (isDetecting || video == null || video.readyState < 2) {
    return;
  }
  isDetecting = true;

  try {
    // Wait for the single detector instance to be ready
    const start = Date.now();
    const detector = await detectorPromise;
    const hands = await detector.estimateHands(video, {
      flipHorizontal: false,
    });
    const end = Date.now();
    console.log(`Hand detection took ${end - start}ms`);

    if (webcam.onHandsDetected) {
      webcam.onHandsDetected(hands);
    }

    if (hands.length > 0) {
      console.log("Detected hands:", hands);
    }
  } catch (error) {
    console.error("Hand detection failed:", error);
  } finally {
    isDetecting = false;
  }
}

export function mapEvent(event: KeyboardEvent): IKeyboardEvent {
  if (event.type === "keydown") {
    // Trigger hand detection on keydown.
    // We don't await it to avoid blocking the main thread.
    void detect();
  }
  if (event.type === "keydown" || event.type === "keyup") {
    return {
      type: event.type,
      timeStamp: timeStampOf(event),
      code: event.code,
      key: event.key,
      modifiers: getModifiers(event),
    };
  } else {
    throw new TypeError();
  }
}

export function timeStampOf({ timeStamp }: Event): number {
  return timeStamp || performance.now();
}
