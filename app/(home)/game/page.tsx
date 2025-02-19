"use client"
import Image from "next/image";
import Footer from "../../components/footer";
import axios from "axios";
import { useEffect, useState } from 'react';
import axiosInstance from '../../../lib/axiosInstance';

interface GameItem {
  imageUrl: string;
  title: string;
  descreption: string;
  link: string;
  id: string;
}

export default function Home() {
  const [data, setData] = useState<GameItem[] | null>(null);

  useEffect(() => {
    axiosInstance.get('/assets/js/gamelist.json') // Replace with your API endpoint
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);
  return (
 
  
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
       
       
    {data ? (
      <div className="gallery grid grid-cols-3 gap-4">
        {data.map((item, index) => (
          <div key={index} className="gallery-item">
      <a href={`/player?idurl=${item.id}`}>      
      <img src={item.imageUrl} alt={item.title} className="w-full h-auto" />
            <h2>{item.descreption}</h2></a>
          </div>
        ))}
      </div>
    ) : (
      <p>Loading...</p>
    )}
       
      </main>
    <Footer></Footer>
    </div>
  );
}
