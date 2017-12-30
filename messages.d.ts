import * as Paper from "paper";

declare const enum TYPE {
  curve = 'curve'
}

// Other types
type curveCommand = 1 | 0 | -1;

interface Direction {
  x: number;
  y: number;
  rad: number;
  deg: number;
}

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

interface Point {
  x: number,
  y: number
}

// Curve update
declare const enum CurveUpdateType {
  START_SEGMENT = 'startSegment',
  ADD_TO_SEGMENT = 'move'
}
interface CurveUpdate_startSegment {
  type: CurveUpdateType.START_SEGMENT
  pos: Point
}
interface CurveUpdate_addToSegment {
  type: CurveUpdateType.ADD_TO_SEGMENT
  command: curveCommand
  pos: Point
}

type CurveUpdate = CurveUpdate_startSegment | CurveUpdate_addToSegment;

interface Curve {
  id: number,
  pos: Paper.Point,
  direction: Direction,
  updates: CurveUpdate[]
  path?: Paper.CompoundPath
}

interface AppMessage_init {
  type: AppMessageType.INIT,
  width: number,
  height: number
  playerId: number
}
interface AppMessage_update {
  type: AppMessageType.UPDATE,
  curves: Array<Curve>,
  pos: Paper.Point,
  direction: Direction,
  id: number
}

type AppMessageData = AppMessage_init | AppMessage_update;

interface AppMessage extends MessageEvent {
  data: AppMessageData
}