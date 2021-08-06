import * as poseDetection from '@tensorflow-models/pose-detection';
import { MATCH_REULT } from '../models';

export default class Hat {
  private prevHand: poseDetection.Keypoint = undefined;
  private tracked = ['left_eye', 'right_eye', 'right_wrist'];

  private debugging = false;

  public test(normalizedKeypoints: poseDetection.Keypoint[]): MATCH_REULT {
    const points = normalizedKeypoints
      .filter(({ name }) => this.tracked.includes(name))
      .reduce((aggr, curr) => { aggr[curr.name] = curr; return aggr; }, {} as { [key: string]: poseDetection.Keypoint });

    const head = this.getHeadPosition(points);
    const hand = points.right_wrist;

    if (head.score > 0.5 && hand.score > 0.5) {
      const matchResult = this.match(head, hand);
      this.prevHand = hand;
      this.debug(matchResult);
      return matchResult;
    } else {
      return MATCH_REULT.UNKNOWN;
    }
  }

  public match(head: poseDetection.Keypoint, hand: poseDetection.Keypoint): MATCH_REULT {
    if (Math.abs(head.x - hand.x) > 0.2) {
      this.debug('head and hand not aligned', head, hand);
      return MATCH_REULT.NO;
    }

    if (head.y < hand.y) {
      this.debug('head above hand', head, hand);
      return MATCH_REULT.DONE;
    }

    if (this.prevHand && hand.y - this.prevHand.y < 0) {
      this.debug('hand moving up', this.prevHand.y, hand.y);
      return MATCH_REULT.NO;
    }

    return MATCH_REULT.YES;
  }

  private getHeadPosition(points: { [key: string]: poseDetection.Keypoint }): poseDetection.Keypoint {
    if (!points.left_eye) {
      return undefined;
    }

    if (!points.right_eye) {
      return undefined;
    }

    return {
      score: Math.min(points.left_eye.score, points.right_eye.score),
      x: (points.left_eye.x + points.right_eye.x) / 2,
      y: (points.left_eye.y + points.right_eye.y) / 2 - Math.abs((points.left_eye.x - points.right_eye.x))
    };
  }

  private debug(...args) {
    if (this.debugging) {
      console.log(...args);
    }
  }
}