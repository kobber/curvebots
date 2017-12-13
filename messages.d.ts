import * as Paper from "paper";

declare const enum TYPE {
  curve = 'curve'
}

// Other types
type curveCommand = 1 | 0 | -1;

// Worker messages
declare const enum WorkerMessageType {
  READY = 'ready',
  UPDATE = 'update',
  PAINT = 'paint'
}

interface WorkerMessage_ready {
  type: WorkerMessageType.READY
}

interface WorkerMessage_update {
  type: WorkerMessageType.UPDATE,
  id: number,
  command: curveCommand
}

interface WorkerMessage_paint {
  type: WorkerMessageType.PAINT,
  paperState: string
}

type WorkerMessageData = WorkerMessage_ready | WorkerMessage_update | WorkerMessage_paint

interface WorkerMessage extends MessageEvent {
  data: WorkerMessageData
}

// App messages
declare const enum AppMessageType {
  INIT = 'init',
  UPDATE = 'update'
}

interface Direction {
  x: number,
  y: number
}

interface Curve {
  pos: Paper.Point,
  direction: Direction
}

interface AppMessage_init {
  type: AppMessageType.INIT,
  width: number,
  height: number
}
interface AppMessage_update {
  type: AppMessageType.UPDATE,
  paperState: string,
  curves: Array<Curve>,
  pos: Paper.Point,
  direction: any,
  id: number
}

type AppMessageData = AppMessage_init | AppMessage_update;

interface AppMessage extends MessageEvent {
  data: AppMessageData
}