import * as poseDetection from '@tensorflow-models/pose-detection';

export enum MATCH_REULT {
  UNKNOWN = 'UNKNOWN',
  YES = 'YES',
  NO = 'NO',
  DONE = 'DONE',
}

export interface FrameData {
  frame: ImageData;
  pose: poseDetection.Pose;
  matches: boolean;
  start: boolean;
  end: boolean;
}

export interface GIFEncoder {
  setDelay: (ms: number) => void;
  setRepeat: (iter: number) => void;
  setSize: (w: number, h: number) => void;
  start: () => void;
  finish: () => void;
  stream: () => ByteArray;
  addFrame: (im: ImageData | OffscreenCanvasRenderingContext2D, is_imageData: boolean) => boolean;
}

interface ByteArray {
  bin: number[];
}