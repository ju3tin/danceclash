// Extend the Window interface to include the 'tracker' property
interface Window {
    tracker: any;
  }
  interface Window {
    poseDetection: typeof import('@tensorflow-models/pose-detection');
  }