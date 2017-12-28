self.importScripts('../node_modules/paper/dist/paper-core.min.js');
import * as Paper from 'paper';
import { TYPE, AppMessage, AppMessageType, WorkerMessageType, curveCommand, WorkerMessageData, Curve } from '../messages';
declare const paper: typeof Paper;

paper.install(this);

export abstract class Bot {
  debugLayer: Paper.Layer;
  constructor() {
    // Listen for messages from game
    addEventListener('message', (e: AppMessage) => {
      switch (e.data.type) {

        case AppMessageType.INIT:
          paper.setup([e.data.width, e.data.height]);
          paper.project.currentStyle.strokeColor = "#fff";
          paper.project.currentStyle.strokeWidth = 1;
          paper.project.currentStyle.dashArray = [1,1];
          this.postMessage({
            type: WorkerMessageType.READY
          });
          break;

        case AppMessageType.UPDATE:
          paper.project.clear();
          paper.project.importJSON(e.data.paperState);
          this.debugLayer = new paper.Layer();
          this.debugLayer.activate();
          const curves = paper.project.getItems({ data: { type: TYPE.curve } });
          this.update(e.data.id, {
            paper: paper,
            curves: curves,
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
      paperState: this.debugLayer.exportJSON()
    });
  }
  postMessage(message: WorkerMessageData) {
    postMessage(message);
  }
  abstract update(id: number, data: {
    paper: typeof Paper,
    curves: Array<Paper.Item>,
    pos: Paper.Point,
    bounds: Paper.Path,
    direction: any,
  });
}
