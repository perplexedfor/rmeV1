"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalManager = void 0;
//@ts-ignore
const node_pty_1 = require("node-pty");
const path_1 = __importDefault(require("path"));
const SHELL = "bash";
class TerminalManager {
    sessions = {};
    constructor() {
        this.sessions = {};
    }
    createPty(id, replId, onData) {
        let term = (0, node_pty_1.fork)(SHELL, [], {
            cols: 100,
            name: 'xterm',
            cwd: path_1.default.join(__dirname, `../tmp/${replId}`)
        });
        term.on('data', (data) => onData(data, term.pid));
        this.sessions[id] = {
            terminal: term,
            replId
        };
        term.on('exit', () => {
            delete this.sessions[term.pid];
        });
        return term;
    }
    write(terminalId, data) {
        this.sessions[terminalId]?.terminal.write(data);
    }
    clear(terminalId) {
        this.sessions[terminalId].terminal.kill();
        delete this.sessions[terminalId];
    }
}
exports.TerminalManager = TerminalManager;
//# sourceMappingURL=pty.js.map