import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

const DanceClashVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);

  useEffect(() => {
    // Load the pose detection model
    const loadModel = async () => {
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      const poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );
      setDetector(poseDetector);
    };

    loadModel();

    // Start the video stream
    const startVideo = async () => {
      if (navigator.mediaDevices && videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    };

    startVideo();

    return () => {
      // Clean up resources on unmount
      videoRef.current?.srcObject && (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    const detectPose = async () => {
      if (detector && videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');

        if (!ctx) return;

        const video = videoRef.current;

        const drawPose = async () => {
          const poses = await detector.estimatePoses(video);

          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(video, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

          poses.forEach(pose => {
            pose.keypoints.forEach(keypoint => {
              if (keypoint.score && keypoint.score > 0.5) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
              }
            });
          });

          requestAnimationFrame(drawPose);
        };

        drawPose();
      }
    };

    detectPose();
  }, [detector]);

  return (
    <div>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          border: '2px solid black',
        }}
      />
    </div>
  );
};

export default DanceClashVideo;