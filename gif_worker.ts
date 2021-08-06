import './js/LZWEncoder.js';
import './js/NeuQuant.js';
import './js/GIFEncoder.js';

import { GIFEncoder } from './models';
import Hat from './movement-augmenters/hat';

// TODO: https://github.com/microsoft/TypeScript/issues/20595
const worker: Worker = self as unknown as Worker;
let ctx: OffscreenCanvasRenderingContext2D = undefined;
let width: number = undefined;
let height: number = undefined;
let augmenter = new Hat();

const encoder: GIFEncoder = new (self as any).GIFEncoder(); //create a new GIFEncoder for every new job
encoder.setRepeat(0);
encoder.start();

worker.addEventListener('message', async ({ data }) => {
  switch (data.type) {
    case 'gif:setOptions':
      width = data.width;
      height = data.height;

      encoder.setSize(width, height);
      encoder.setDelay(data.delay);

      const offscreen = new OffscreenCanvas(width, height);
      ctx = offscreen.getContext('2d');
      break;
    case 'gif:addFrames':
      ctx.fillStyle = 'lightgreen';

      await augmenter.augment(data.frames, ctx, encoder);

      encoder.finish();

      const { bin } = encoder.stream();
      const url = URL.createObjectURL(new Blob([new Uint8Array(bin)], { type: "image/gif" }));

      worker.postMessage({ type: 'gif:url', url });

      encoder.start();
      break;
    default: throw new Error(`unexpected message type: ${data.type}`)
  }
});
