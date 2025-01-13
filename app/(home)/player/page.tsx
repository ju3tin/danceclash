// pages/index.tsx

"use client"
import { useEffect, useState, useRef } from "react";

import Image from "next/image";
import Video from 'next-video';
//import getStarted from ''';
import Footer from "../../components/footer";
import axios from "axios";
import axiosInstance from '../../../lib/axiosInstance';
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from '@tensorflow/tfjs-core';

interface GameItem {
  imageUrl: string;
  title: string;
  descreption: string;
  link: string;
  video: string;
}

const HomePage = () => {
  const [data, setData] = useState<GameItem[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoUrl, setVideoUrl] = useState("/videos/1.mp4");

  useEffect(() => {
    axiosInstance.get('/assets/js/gamelist.json')
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });

    let detector: posedetection.PoseDetector | null = null;

    const initializeMoveNet = async () => {
      await tf.setBackend("webgl");
      detector = await posedetection.createDetector(posedetection.SupportedModels.MoveNet);

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

    const detectPoses = async (video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null) => {
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
          // Ensure video is playing
          if (video.paused || video.ended) {
            requestAnimationFrame(detect);
            return;
          }

          const poses = await detector?.estimatePoses(video, {
            flipHorizontal: false
          });

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (poses && poses.length > 0) {
            poses.forEach((pose) => {
              pose.keypoints.forEach((keypoint) => {
                if (keypoint.score && keypoint.score > 0.5) {
                  ctx.beginPath();
                  ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                  ctx.fillStyle = "red";
                  ctx.fill();
                }
              });
            });
          }

          // Use setTimeout instead of requestAnimationFrame to give time for tensor cleanup
          setTimeout(() => {
            requestAnimationFrame(detect);
          }, 0);
          
        } catch (error) {
          console.error('Detection error:', error);
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
  }, []);

  const handlePlayVideo = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play();
    }
  };

  const handleVideoChange = (newUrl: string) => {
    setVideoUrl(newUrl);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.load(); // Reload video with new source
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>TensorFlow MoveNet with Next.js</h1>
      <div style={{ marginBottom: "20px" }}>  
        <button onClick={() => handleVideoChange("/videos/1.mp4")}>Video 1</button>
        <button onClick={() => handleVideoChange("/videos/2.mp4")}>Video 2</button>
        <button onClick={() => handleVideoChange("/videos/3.mp4")}>Video 3</button>
      </div>
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "20px",
        margin: "0 auto"
      }}>
        <div style={{ position: "relative", width: "640px", height: "480px" }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%" }} />
          <canvas 
            ref={canvasRef} 
            style={{ 
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%"
            }} 
          />
        </div>

        <div style={{ position: "relative", width: "640px" }}>
          <video 
            ref={remoteVideoRef} 
            className="remotevideo" 
            width="640"
            style={{ width: "100%" }}
            preload="yes"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <canvas 
            ref={remoteCanvasRef} 
            style={{ 
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%"
            }} 
          />
          <button 
            onClick={handlePlayVideo}
            style={{
              position: "absolute",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Play Video
          </button>
        </div>
      </div>
      {data ? (
        <div className="gallery grid grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div key={index} className="gallery-item">
              <a 
                onClick={() => handleVideoChange(item.video)} 
                style={{ 
                  cursor: 'pointer',
                  display: 'block',
                  transition: 'transform 0.2s'
                }}
                className="hover:opacity-80 hover:scale-105 transform transition-all"
              >
                <img src={item.imageUrl} alt={item.title} className="w-full h-auto" />
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

export default HomePage;