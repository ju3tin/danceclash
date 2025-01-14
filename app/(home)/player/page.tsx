// pages/index.tsx

"use client"
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from 'next/navigation'
import Image from "next/image";
import Video from 'next-video';
//import getStarted from ''';
import Footer from "../../components/footer";
import axios from "axios";
import axiosInstance from '../../../lib/axiosInstance';
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from '@tensorflow/tfjs-core';
import { search } from "@tensorflow/tfjs-core/dist/io/composite_array_buffer";

interface GameItem {
  imageUrl: string;
  title: string;
  descreption: string;
  link: string;
  video: string;
  id: string;
}

// Create a separate component for the main content
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [remotePose, setRemotePose] = useState<posedetection.Pose | null>(null);
  const [currentPose, setCurrentPose] = useState<posedetection.Pose | null>(null);

  useEffect(() => {
    const urlSearch = searchParams.get('idurl');
    setSearch(urlSearch || '1');
    console.log('this is the 1 ' + urlSearch);
 

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

      detectPoses(videoRef.current, canvasRef.current, false);
      detectPoses(remoteVideoRef.current, remoteCanvasRef.current, true);
    };

    const detectPoses = async (video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null, isRemote: boolean) => {
      if (!detector || !video || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const detect = async () => {
        try {
          // Skip detection if video is not playing
          if (video.paused || video.ended) {
            requestAnimationFrame(() => detect());
            return;
          }

          const poses = await detector?.estimatePoses(video, {
            flipHorizontal: false
          });

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (poses && poses.length > 0) {
            if (isRemote) {
              setRemotePose(poses[0]);
            } else {
              setCurrentPose(poses[0]);
              
              // Only calculate score if remote video is playing and we have isPlaying state true
              if (remotePose && isPlaying && !remoteVideoRef.current?.paused) {
                const similarity = calculatePoseSimilarity(poses[0], remotePose);
                setScore(Math.round(similarity));
              }
            }

            // Draw keypoints and skeleton...
            poses[0].keypoints.forEach((keypoint) => {
              // ... rest of drawing code
            });
          }

          requestAnimationFrame(() => detect());
        } catch (error) {
          console.error('Detection error:', error);
          requestAnimationFrame(() => detect());
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

  const startCountdown = () => {
    setCountdown(3);
    setScore(0); // Reset score when starting
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.play();
            setIsPlaying(true); // Set playing state to true
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const video = remoteVideoRef.current;
    if (!video) return;

    const handleEnd = () => {
      setIsPlaying(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('ended', handleEnd);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('ended', handleEnd);
      video.removeEventListener('pause', handlePause);
    };
  }, [remoteVideoRef]);

  return (
    <div style={{ textAlign: "center" }}>
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
            style={{ 
              height: "100%",
              maxHeight: "100vh",
              objectFit: "contain",
              display: isPlaying ? "block" : "none"
            }}
            preload="auto"
          >
            <source 
              src={`/videos/${searchParams.get('idurl') || '1'}.mp4`} 
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video>
          <div 
            style={{ 
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
             maxHeight: "100vh",
              backgroundImage: `url("/images/${searchParams.get('idurl')}.png")`, // Set your background image here
              backgroundSize: 'cover', // Adjusts the image to cover the entire div
              backgroundPosition: 'center' // Centers the background image
            }} 
          >
            <canvas 
              ref={remoteCanvasRef} 
              style={{ 
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                maxHeight: "100vh",
                backgroundImage: `url("/images/${searchParams.get('idurl')}.png")`, // Set your background image here
                backgroundSize: 'cover', // Adjusts the image to cover the entire div
                backgroundPosition: 'center' // Centers the background image
             
              }} 
            />
          </div>
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
              cursor: countdown !== null ? "default" : "pointer"
            }}
          >
            {countdown !== null ? `Starting in ${countdown}...` : 'Play Video'}
          </button>
          <div 
            style={{ 
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "48px",
              color: "white",
              zIndex: 20
            }}
          >
            {isPlaying ? `Score: ${score}` : ''}
          </div>
        </div>
      </div>
      {data ? (
        <div className="gallery grid grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div key={index} className="gallery-item">
              <a 
                onClick={() => {
               //   handleVideoChange(item.video);
                  window.location.href = '/player?idurl='+item.id; // Navigate to the URL
                }} 
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

// Main page component
const HomePage = () => {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    }>
      <PlayerContent />
    </Suspense>
  );
};

export default HomePage;