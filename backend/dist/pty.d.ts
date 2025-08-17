export declare class TerminalManager {
    private sessions;
    constructor();
    createPty(id: string, replId: string, onData: (data: string, id: number) => void): any;
    write(terminalId: string, data: string): void;
    clear(terminalId: string): void;
}
//# sourceMappingURL=pty.d.ts.map