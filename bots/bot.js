var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
self.importScripts('../node_modules/paper/dist/paper-core.min.js');
paper.install(this);
var Bot = /** @class */ (function () {
    function Bot() {
        var _this = this;
        // Listen for messages from game
        addEventListener('message', function (e) {
            switch (e.data.type) {
                case "init" /* INIT */:
                    paper.setup([e.data.width, e.data.height]);
                    _this.postMessage({
                        type: "ready" /* READY */
                    });
                    break;
                case "update" /* UPDATE */:
                    paper.project.clear();
                    paper.project.importJSON(e.data.paperState);
                    _this.update(e.data.id, {
                        paper: paper,
                        curves: e.data.curves,
                        pos: e.data.pos,
                        direction: e.data.direction,
                    });
                    break;
                default:
                    break;
            }
        }, false);
    }
    Bot.prototype.sendCommand = function (id, command) {
        this.postMessage({
            type: "update" /* UPDATE */,
            id: id,
            command: command
        });
    };
    Bot.prototype.postMessage = function (message) {
        postMessage(message);
    };
    return Bot;
}());
var MyBot = /** @class */ (function (_super) {
    __extends(MyBot, _super);
    function MyBot() {
        var _this = _super.call(this) || this;
        _this.count = 0;
        return _this;
    }
    MyBot.prototype.update = function (id, data) {
        var shapes = paper.project.getItems({ data: { type: 0 } });
        var command = 0;
        // Do some collision checking
        // Check if we can go straight
        var newPoint = new paper.Point(data.pos.x + (34 * data.direction.x), data.pos.y + (34 * data.direction.y));
        var collisionline = new paper.Path([
            data.pos, newPoint
        ]);
        if (!paper.view.bounds.contains(newPoint)) {
            command = -1;
        }
        for (var _i = 0, shapes_1 = shapes; _i < shapes_1.length; _i++) {
            var shape = shapes_1[_i];
            if (collisionline.intersects(shape)) {
                command = -1;
            }
        }
        collisionline.remove();
        this.sendCommand(id, command);
        if (this.count > 20) {
            this.count = 0;
        }
    };
    return MyBot;
}(Bot));
new MyBot();
//# sourceMappingURL=bot.js.map