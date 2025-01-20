import React, { useEffect, useRef } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';



const DanceClash = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadTracker = async () => {
      // Ensure WebGL backend is set
      await tf.setBackend('webgl');

      // Make poseDetection globally available for tracker.js
      window.poseDetection = poseDetection;

      // Load tracker.js dynamically
      const script = document.createElement('script');
      script.src = '/tracker.js'; // Ensure this path matches your setup
      script.onload = () => {
        if (window.tracker) {
          const tracker = window.tracker;

          // Attach video and canvas elements to tracker
          tracker.elVideo = '#video';
          tracker.elCanvas = '#canvas';

          // Initialize the tracker
          tracker.init();

          // Start tracking with camera
          tracker.initCamera();
        }
      };
      document.body.appendChild(script);
    };

    loadTracker();

    return () => {
      const script = document.querySelector('script[src="/tracker.js"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div>
      <video
        id="video1"
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: 'block' }}
        controls
        src="/videos/1.mp4"
      />
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          border: '2px solid red',
        }}
      ></canvas>
    </div>
  );
};

export default DanceClash;