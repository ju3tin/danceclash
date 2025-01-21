import { useEffect, useRef } from "react";

const DanceClash: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const canvas1Ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const setupPoseDetection = async () => {
      const tf = await import("@tensorflow/tfjs");
      const poseDetection = await import("@tensorflow-models/pose-detection");
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        }
      );

      if (video1Ref.current && canvas1Ref.current) {
        const video = video1Ref.current;
        const canvas = canvas1Ref.current;
        const ctx = canvas.getContext("2d");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
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
          if (!ctx) return;

          const poses = await detector.estimatePoses(video);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (poses.length > 0 && poses[0].keypoints) {
            drawKeypoints(poses[0].keypoints, ctx);
          }

          requestAnimationFrame(detectPose);
        };

        detectPose();
      }
    };

    setupPoseDetection();
  }, []);

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
    <div>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: row;
          height: 100vh;
          background-color: #000;
        }
        .column {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        video,
        canvas {
          max-width: 100%;
          height: 100%;
        }
      `}</style>
      <div className="container">
        <div className="column">
          <canvas ref={canvasRef}></canvas>
          <video
            ref={videoRef}
            muted
            autoPlay
            preload="metadata"
            className="video-js"
          ></video>
        </div>
        <div className="column">
          <canvas ref={canvas1Ref}></canvas>
          <video ref={video1Ref} muted autoPlay playsInline></video>
        </div>
      </div>
    </div>
  );
};

export default DanceClash;