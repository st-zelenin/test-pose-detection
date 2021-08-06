
import '@tensorflow/tfjs-backend-webgl';

import { testCanvas } from './test';

run();

async function run() {
  const video = document.getElementById('pose-detector-input') as HTMLVideoElement;
  const canvas = document.getElementById('pose-detector-output') as HTMLCanvasElement;

  const stream = await getMedia();

  if (video && canvas && stream) {
    video.srcObject = stream;
    video.play();
    video.onloadeddata = async () => {
      testCanvas(video, canvas);
    }
  }
}

async function getMedia() {
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
}