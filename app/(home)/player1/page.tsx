"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Footer from "../../components/footer";
import axios from "axios";
import axiosInstance from "../../../lib/axiosInstance";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";

interface GameItem {
  imageUrl: string;
  title: string;
  descreption: string;
  link: string;
  video: string;
  id: string;
}

const PlayerContent = () => {
  const [data, setData] = useState<GameItem[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoUrl, setVideoUrl] = useState("/videos/1.mp4");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [search, setSearch] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [score, setScore] = useState(0);

  useEffect(() => {
    const urlSearch = searchParams.get("idurl");
    setSearch(urlSearch || "1");

    axiosInstance
      .get("/assets/js/gamelist.json")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    let detector: posedetection.PoseDetector | null = null;

    const initializeMoveNet = async () => {
      await tf.setBackend("webgl");
      detector = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet
      );

      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      detectPoses(videoRef.current, canvasRef.current);
      detectPoses(remoteVideoRef.current, remoteCanvasRef.current);
    };

    const detectPoses = async (
      video: HTMLVideoElement | null,
      canvas: HTMLCanvasElement | null
    ) => {
      if (!detector || !video || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        requestAnimationFrame(() => detectPoses(video, canvas));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const detect = async () => {
        try {
          if (video.paused || video.ended) {
            requestAnimationFrame(detect);
            return;
          }

          const poses = await detector?.estimatePoses(video, {
            flipHorizontal: false,
          });

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (poses && poses.length > 0) {
            poses.forEach((pose) => {
              let currentScore = 0; // Track score for this frame
              pose.keypoints.forEach((keypoint) => {
                if (keypoint.score && keypoint.score > 0.3) {
                  ctx.beginPath();
                  ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                  ctx.fillStyle = "red";
                  ctx.fill();

                  // Increment score for valid keypoints
                  currentScore += 10; // Add 10 points for each detected keypoint
                }
              });

              setScore((prevScore) => prevScore + currentScore); // Update global score
            });
          }

          setTimeout(() => {
            requestAnimationFrame(detect);
          }, 0);
        } catch (error) {
          console.error("Detection error:", error);
          requestAnimationFrame(detect);
        }
      };

      detect();
    };

    initializeMoveNet();

    return () => {
      detector?.dispose();
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [searchParams]);

  const handleVideoChange = (newUrl: string) => {
    setScore(0); // Reset score on video change
    setVideoUrl(newUrl);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.load();
    }
  };

  const startCountdown = () => {
    setCountdown(3); // Start at 3 seconds

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.play();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          margin: "0 auto",
        }}
      >
        <div style={{ position: "relative", width: "640px", height: "480px" }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%" }} />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </div>

        <div style={{ position: "relative", width: "640px" }}>
          <video
            ref={remoteVideoRef}
            className="remotevideo"
            width="640"
            style={{
              height: "100%",
              maxHeight: "100vh",
              objectFit: "contain",
              display: "none",
            }}
            preload="yes"
          >
            <source
              src={`/videos/${searchParams.get("idurl") || "1"}.mp4`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
          <button
            onClick={startCountdown}
            disabled={countdown !== null}
            style={{
              position: "absolute",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              padding: "8px 16px",
              backgroundColor: countdown !== null ? "#888" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: countdown !== null ? "default" : "pointer",
            }}
          >
            {countdown !== null ? `Starting in ${countdown}...` : "Play Video"}
          </button>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "48px",
              color: "white",
              zIndex: 20,
            }}
          >
            Score: {score}
          </div>
        </div>
      </div>
      {data ? (
        <div className="gallery grid grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div key={index} className="gallery-item">
              <a
                onClick={() => {
                  window.location.href = "/player?idurl=" + item.id;
                }}
                style={{
                  cursor: "pointer",
                  display: "block",
                  transition: "transform 0.2s",
                }}
                className="hover:opacity-80 hover:scale-105 transform transition-all"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-auto"
                />
                <h2>{item.descreption}</h2>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

const HomePage = () => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <div>Loading...</div>
        </div>
      }
    >
      <PlayerContent />
    </Suspense>
  );
};

export default HomePage;