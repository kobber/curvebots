self.importScripts('../node_modules/paper/dist/paper-core.min.js');
import * as Paper from 'paper';
import { TYPE, AppMessage, AppMessageType, WorkerMessageType, curveCommand, WorkerMessageData, Curve } from '../messages';
import { CurvePainter } from '../shared';
declare const paper: typeof Paper;

paper.install(this);

export abstract class Bot {
  debugLayer: Paper.Layer;
  playerId: number;
  curvePainters: { [playerId: number]: CurvePainter };

  getMyCurve(curves: Curve[]) {
    return curves.filter(curve => curve.id === this.playerId)[0];
  }

  constructor() {
    // Listen for messages from game
    addEventListener('message', (e: AppMessage) => {
      switch (e.data.type) {

        case AppMessageType.INIT:
          this.playerId = e.data.playerId;
          paper.setup([e.data.width, e.data.height]);
          paper.project.currentStyle.strokeColor = "#fff";
          paper.project.currentStyle.strokeWidth = 1;
          paper.project.currentStyle.dashArray = [1, 1];
          this.curvePainters = {};
          this.postMessage({
            type: WorkerMessageType.READY
          });
          break;

        case AppMessageType.UPDATE:
          for (const curve of e.data.curves) {
            if (!(curve.id in this.curvePainters)) {
              this.curvePainters[curve.id] = new CurvePainter(paper, curve.id, new paper.Color('#fff'));
            }
            let curvePainter: CurvePainter = this.curvePainters[curve.id];
            curvePainter.playbackRecordedData(curve.updates);
            curve.path = curvePainter.path;
          }
          this.debugLayer = new paper.Layer();
          this.debugLayer.activate();
          this.update(e.data.id, {
            paper: paper,
            curves: e.data.curves,
            bounds: new paper.Path.Rectangle(paper.view.bounds),
            pos: new paper.Point(e.data.pos),
            direction: e.data.direction,
          });
          break;

        default:
          break;
      }
    }, false);
  }
  sendCommand(id: number, command: curveCommand) {
    this.postMessage({
      type: WorkerMessageType.UPDATE,
      id: id,
      command: command
    });
  }
  sendPaintMessage(paperProject: Paper.Project) {
    this.postMessage({
      type: WorkerMessageType.PAINT,
      paperState: this.debugLayer.exportJSON({ asString: false })
    });
  }
  postMessage(message: WorkerMessageData) {
    postMessage(message);
  }
  abstract update(id: number, data: {
    paper: typeof Paper,
    curves: Curve[],
    pos: Paper.Point,
    bounds: Paper.Path,
    direction: any,
  });
}
