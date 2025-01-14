// pages/index.tsx

"use client"
import { useEffect, useState, useRef } from "react";
import { Suspense } from 'react'
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
}

const HomePage = () => {
  const [data, setData] = useState<GameItem[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoUrl, setVideoUrl] = useState("/videos/1.mp4");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [search, setSearch] = useState<string | null>(null);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchComponent setSearch={setSearch} />
      {/* ... existing code ... */}
      <video ref={remoteVideoRef} className="remotevideo" width="640">
        {search ? (
          <source src={`/videos/${search}.mp4`} type="video/mp4" />
        ) : (
          <source src="" type="video/mp4" /> // Placeholder or empty source
        )}
        Your browser does not support the video tag.
      </video>
      {/* ... existing code ... */}
    </Suspense>
  );
};

const SearchComponent = ({ setSearch }: { setSearch: (search: string | null) => void }) => {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const search = searchParams.get('idurl');
    console.log('this is the 1 ' + search);
    setSearch(search); // Set the search value
  }, [searchParams, setSearch]); // Ensure setSearch is included in the dependency array

  return null; // This component does not render anything
};

export default HomePage;