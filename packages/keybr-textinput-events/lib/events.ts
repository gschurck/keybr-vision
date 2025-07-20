import {
  createDetector, HandDetector,
  SupportedModels
} from "@tensorflow-models/hand-pose-detection";
import { getModifiers } from "./modifiers.ts";
import { type IKeyboardEvent } from "./types.ts";
const model = SupportedModels.MediaPipeHands;
const detectorConfig = {
  runtime: 'mediapipe', // or 'tfjs',
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
  modelType: 'full'
}
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
// async function detect(){
//   const detector = await createDetector(model, detectorConfig);
//   const hands = await detector.estimateHands(image);
// }

console.log("Hello World!")

// Initialize the detector and load the image when the module loads.
// These promises will be resolved only once.
const detectorPromise: Promise<HandDetector> = createDetector(model, detectorConfig);
const imagePromise: Promise<HTMLImageElement> = loadImage('/hands.jpg');

let isDetecting = false;

async function detect() {
  if (isDetecting) return; // Prevent multiple detections from running at once
  isDetecting = true;

  try {
    // Wait for the single detector instance and image to be ready
    const [detector, image] = await Promise.all([detectorPromise, imagePromise]);
    const hands = await detector.estimateHands(image);
    console.log('Detected hands:', hands);
  } catch (error) {
    console.error("Hand detection failed:", error);
  } finally {
    isDetecting = false;
  }

}



export function mapEvent(event: KeyboardEvent): IKeyboardEvent {
  if (event.type === "keydown") {
    console.log(`mapEvent: ${event.type}`, {
      timeStamp: timeStampOf(event),
      code: event.code,
      key: event.key,
      modifiers: getModifiers(event),
    }
    );
    detect()
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
