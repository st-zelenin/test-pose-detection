import { ImageSize } from '@tensorflow-models/pose-detection/dist/calculators/interfaces/common_interfaces';

export async function testCanvas(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const imageSize: ImageSize = { height: video.videoHeight, width: video.videoWidth };
  canvas.width = imageSize.width;
  canvas.height = imageSize.height;

  const worker = new Worker('worker.ts');
  const offscreen = canvas.transferControlToOffscreen();
  worker.postMessage({ type: 'initialize', canvas: offscreen, imageSize }, [offscreen]);

  worker.addEventListener('message', ({ data }) => {
    switch (data.type) {
      case 'initialized':
        drawFrame();
        break;
      case 'poses-detected':
        drawFrame();
        break;
      default: throw new Error(`unexpected message type: ${data.type}`);
      case 'gif:url':
        download(data.url);
        break;
    }
  });

  async function drawFrame() {
    const imageBitmap = await createImageBitmap(video)
    worker.postMessage({ type: 'draw-frame', imageBitmap }, [imageBitmap]);
  }

  function download(url: string) {  
    const a = document.createElement("a");
    a.download = "download.gif";
    a.href = url;
    a.click();
  
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 10000);
  }
}