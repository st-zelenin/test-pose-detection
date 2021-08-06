import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { ImageSize } from "@tensorflow-models/pose-detection/dist/calculators/interfaces/common_interfaces";
import CyclicalFixedArray from './cyclical-fixed-array';
import Hat from './pose-testers/hat';
import { FrameData, MATCH_REULT } from './models';

// TODO: https://github.com/microsoft/TypeScript/issues/20595
const worker: Worker = self as unknown as Worker;
const gifWorker = new Worker('gif_worker.ts');
const movement = new Hat();

let frameSize: ImageSize = undefined;
let ctx: OffscreenCanvasRenderingContext2D = undefined;
let detector: poseDetection.PoseDetector = undefined;
let isRecording = true;
let poseMatches = false;

const frames = new CyclicalFixedArray<FrameData>(60 * 60); // 1 minute with 60FPS

worker.addEventListener('message', ({ data }) => {
  switch (data.type) {
    case 'initialize':
      return initialize(data.canvas, data.imageSize);
    case 'draw-frame':
      return drawFrame(data.imageBitmap);
    default: throw new Error(`unexpected message type: ${data.type}`)
  }
});

gifWorker.addEventListener('message', ({ data }) => {
  switch (data.type) {
    case 'gif:url':
      isRecording = true;
      frames.reset();

      worker.postMessage({ type: 'gif:url', url: data.url });
      break;
    default: throw new Error(`unexpected message type: ${data.type}`)
  }
});

async function initialize(canvas: OffscreenCanvas, imageSize: ImageSize) {
  ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.font = '12px serif';

  frameSize = imageSize;

  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet); //, { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER });

  gifWorker.postMessage({ type: 'gif:setOptions', width: frameSize.width, height: frameSize.height })

  worker.postMessage({ type: 'initialized' });
}

async function drawFrame(imageBitmap: ImageBitmap) {
  ctx.drawImage(imageBitmap, 0, 0, frameSize.width, frameSize.height);

  const frame = ctx.getImageData(0, 0, frameSize.width, frameSize.height);
  const [pose] = await detector.estimatePoses(frame);

  const normalizedKeypoints =
    poseDetection.calculators.keypointsToNormalizedKeypoints(pose.keypoints, frameSize);

  const matchResult = movement.test(normalizedKeypoints);
  if (matchResult !== MATCH_REULT.UNKNOWN) {
    poseMatches = matchResult === (MATCH_REULT.YES || MATCH_REULT.DONE) ? true : false;
    ctx.fillStyle = poseMatches ? 'lightgreen' : 'red';
  } else {
    ctx.fillStyle = 'yellow';
  }

  if (isRecording) {
    frames.add({ frame, pose, matches: poseMatches, start: false, end: false });

    if (matchResult === MATCH_REULT.DONE) {
      const startFrame = getStartFrame();

      if (startFrame) {
        isRecording = false;
        showProcessing();

        const filtered = frames.slice(frames.indexOf(startFrame), frames.length - 1);
        gifWorker.postMessage({ type: 'gif:addFrames', frames: filtered });
      }
    }
  } else {
    showProcessing();
  }

  for (let point of pose.keypoints) {
    ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
    ctx.fillText(`${point.name} ${point.score.toFixed(1)}`, point.x + 4, point.y + 4);
  }

  worker.postMessage({ type: 'poses-detected' });
}

function getStartFrame() {
  let firstMatchingFrame = undefined;
  let nonMatchingCount = 11;

  for (let frame of frames) {
    if (frame.matches) {
      if (nonMatchingCount > 10) {
        firstMatchingFrame = frame;
      }

      nonMatchingCount = 0;
    } else {
      nonMatchingCount++;
    }
  }

  return firstMatchingFrame;
}

function showProcessing(): void {
  const prevFillStyle = ctx.fillStyle;
  const prevFont = ctx.font;

  ctx.fillStyle = 'red';
  ctx.font = '20px serif';

  ctx.fillText('processing GIF...', 5, 25);

  ctx.fillStyle = prevFillStyle;
  ctx.font = prevFont;
}