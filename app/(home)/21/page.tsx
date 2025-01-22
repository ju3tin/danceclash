"use client";
import { useEffect, useRef, useState } from "react";

const BodyTracker: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure this component only renders on the client
  }, []);

  if (!isClient) {
    return null; // Skip rendering during SSR
  }

  return <BodyTrackerContent />;
};

const BodyTrackerContent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const [model, setModel] = useState<string>("MoveNetSinglePoseLightning");

  useEffect(() => {
    const initializeApp = async () => {
      const poseDetection = await import("@tensorflow-models/pose-detection");
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        }
      );

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            resolve();
          };
        });

        const detectPose = async () => {
          const poses = await detector.estimatePoses(video);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (poses.length > 0) {
            drawKeypoints(poses[0].keypoints, ctx);
          }

          requestAnimationFrame(detectPose);
        };

        detectPose();
        setStatus("Tracking active...");
      }
    };

    initializeApp();
  }, [model]);

  const drawKeypoints = (
    keypoints: Array<{ x: number; y: number; score?: number }>,
    ctx: CanvasRenderingContext2D
  ) => {
    keypoints.forEach((keypoint) => {
      if (keypoint.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      }
    });
  };

  return (
    <div className="container">
      <style jsx>{`
        .container {
          text-align: center;
          background-color: #000;
          color: #fff;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .controls {
          margin-bottom: 20px;
        }

        video,
        canvas {
          width: 80%;
          height: auto;
          border: 2px solid #fff;
        }

        .status {
          margin-top: 20px;
          font-size: 1.2em;
        }
      `}</style>

      <div className="controls">
        <select
          className="model-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="MoveNetSinglePoseLightning">MoveNet - Single Pose (Lightning)</option>
          <option value="MoveNetSinglePoseThunder">MoveNet - Single Pose (Thunder)</option>
          <option value="MoveNetMultiPoseLightning">MoveNet - Multi Pose</option>
          <option value="PoseNetMobileNetV1">PoseNet - MobileNetV1</option>
          <option value="PoseNetResNet50">PoseNet - ResNet50</option>
          <option value="BlazePoseLite">BlazePose - Lite</option>
          <option value="BlazePoseHeavy">BlazePose - Heavy</option>
          <option value="BlazePoseFull">BlazePose - Full</option>
        </select>
      </div>

      <canvas ref={canvasRef}></canvas>
      <video ref={videoRef} autoPlay muted playsInline></video>

      <div className="status">{status}</div>
    </div>
  );
};

export default BodyTracker;