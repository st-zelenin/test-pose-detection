import { FrameData, GIFEncoder } from "../models";

export default class Hat {
  public async augment(frames: FrameData[], ctx: OffscreenCanvasRenderingContext2D, encoder: GIFEncoder) {
    const { hatWidth, hatHeight } = this.calculateHatSize(frames)

    for (const { frame, pose } of frames) {
      const bitmap = await createImageBitmap(frame);
      ctx.drawImage(bitmap, 0, 0, ctx.canvas.width, ctx.canvas.height);

      const rightHand = pose.keypoints.find(({ name }) => name === 'right_wrist');
      if (rightHand) {
        ctx.fillRect(rightHand.x + hatWidth / 2, rightHand.y - hatHeight, hatWidth, hatHeight);
      }

      encoder.addFrame(ctx, false);
    }
  }

  private calculateHatSize(frames: FrameData[]) {
    let hatWidth = 40;
    let hatHeight = 20;

    for (const { pose } of frames) {
      const leftEye = pose.keypoints.find(({ name }) => name === 'left_eye');
      if (!leftEye) {
        continue;
      }

      const rightEye = pose.keypoints.find(({ name }) => name === 'right_eye');
      if (!rightEye) {
        continue;
      }

      hatWidth = Math.abs(leftEye.x - rightEye.x) * 2;
      hatHeight = hatWidth;
      return { hatWidth, hatHeight }
    }

    return { hatWidth, hatHeight };
  }
}