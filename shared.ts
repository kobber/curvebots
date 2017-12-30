import * as Paper from 'paper';
import { TYPE, curveCommand, CurveUpdate, CurveUpdateType, Point } from './messages';


/**
 * Responsible for applying updates to a curve (compound path).
 * 
 * Capable of recording actions for later playback
 * (e.g. on a different instance of a curve object).
 * 
 * The rationale is that the workers receive CurveUpdate[] arrays, which
 * are just lists of commands to execute on the CurvePainter,
 * which they then apply to their own curves.
 * This is much more efficient than serializing and deserializing the entire
 * curve on each update.
 */
export class CurvePainter {
    paper: typeof Paper;
    recordedData: CurveUpdate[];
    recording: boolean;
    path: Paper.CompoundPath;
    _lastCommand: curveCommand | null;

    constructor(paper: typeof Paper, playerId: number, color: Paper.Color) {
        this.paper = paper;
        this.recording = false;
        this.recordedData = [];
        this.path = new this.paper.CompoundPath({
            strokeColor: color,
            fillColor: new this.paper.Color(0, 0, 0, 0),
            strokeCap: 'round',
            strokeWidth: 3,
            data: {
                playerId: playerId,
                type: TYPE.curve,
            }
        });
    }

    playbackRecordedData(recordedData: CurveUpdate[]) {
        for (const action of recordedData) {
            switch (action.type) {
                case CurveUpdateType.START_SEGMENT:
                    this.startSegment(action.pos);
                    break;
                case CurveUpdateType.ADD_TO_SEGMENT:
                    this.addToSegment(action.pos, action.command);
                    break;
            }
        }
    }

    startRecording() {
        this.recording = true;
        this.recordedData = [];
    }

    startSegment(pos: Point) {
        if (this.recording) {
            this.recordedData.push({
                type: CurveUpdateType.START_SEGMENT,
                pos: {
                    x: pos.x, y: pos.y
                }
            });
        }
        const posPoint = new this.paper.Point(pos.x, pos.y);
        this.path.addChild(new this.paper.Path({
            segments: [posPoint],
        }));
    }

    /**
     * Add the position with the given command to the curve.
     * 
     * We assume the position is calculated already, appropriately, for the command.
     * 
     * Needs to know the command, so it can know whether to use a line or an arc.
     * It also keeps allows it to compare the previous command to the current, which
     * can allow it to build an efficient path.
     */
    addToSegment(pos: Point, command: curveCommand) {
        if (this.recording) {
            this.recordedData.push({
                type: CurveUpdateType.ADD_TO_SEGMENT,
                pos: {
                    x: pos.x, y: pos.y
                },
                command: command
            });
        }
        const posPoint = new this.paper.Point(pos.x, pos.y);

        let lastPath = <Paper.Path>this.path.lastChild;

        if (command === this._lastCommand && this._lastCommand !== null && lastPath.segments.length > 1) {
            // If going straight
            if (command === 0) {
                // move point instad of adding new one
                lastPath.lastSegment.remove();
            }

            // If curving
            if ((command === 1 || command === -1) && lastPath.segments.length > 2) {
                const arcThrough = lastPath.lastSegment.point;
                lastPath.lastSegment.remove();
                const path = lastPath.arcTo(arcThrough, posPoint);
            } else {
                lastPath.lineTo(posPoint);
            }
        } else {
            lastPath.lineTo(posPoint);
        }

        this._lastCommand = command;
    }
}