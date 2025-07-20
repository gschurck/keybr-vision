/**
 * A simple state holder for the webcam video element.
 * This is used to share the video element between the React component
 * that displays the feed and the non-React event handling logic that
 * needs to run hand detection on the video frames.
 */
export const webcam = {
  video: null as HTMLVideoElement | null,
};
