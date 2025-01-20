// In your parent component
'use client'
import PoseTracker from './Dance1';

const YourComponent = () => {
  const handlePoseUpdate = (poses: any) => {
    console.log('Poses updated:', poses);
  };

  const handleStatusChange = (status: string) => {
    console.log('Status changed:', status);
  };

  return (
    <PoseTracker
      videoSource="/path/to/your/video.mp4"
      onPoseUpdate={handlePoseUpdate}
      onStatusChange={handleStatusChange}
    />
  );
};