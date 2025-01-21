'use client'
import React from 'react';
import DanceClash from '../../components/Dance1';

const DanceClashPage: React.FC = () => {
  const handlePoseUpdate = (poses: any) => {
    console.log('Poses updated:', poses);
  };

  const handleStatusChange = (status: string) => {
    console.log('Status changed:', status);
  };

  return (
    <div>
      <h1>Dance Clash Game</h1>
      <DanceClash
        videoSource="/path/to/your/video.mp4"
        onPoseUpdate={handlePoseUpdate}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default DanceClashPage;