    import { useEffect, useRef } from "react"
    import { Terminal } from "xterm";
    import { FitAddon } from 'xterm-addon-fit';
    import { Socket } from "socket.io-client";
    const fitAddon = new FitAddon();

    function ab2str(buf: ArrayBuffer) {
        return String.fromCharCode(...new Uint8Array(buf));
    }

    const OPTIONS_TERM = {
        useStyle: true,
        screenKeys: true,
        cursorBlink: true,
        cols: 200,
        theme: {
            background: "black"
        }
    };
    export const TerminalComponent = ({ socket }: { socket: Socket | null }) => {
        const terminalRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => {
            if (!terminalRef || !terminalRef.current || !socket) {
                return;
            }

            socket.emit("requestTerminal");
            socket.on("terminal", terminalHandler)
            const term = new Terminal(OPTIONS_TERM)
            term.loadAddon(fitAddon);
            term.open(terminalRef.current);
            fitAddon.fit();
            function terminalHandler({ data } : { data: string | ArrayBuffer }) {
                if (data instanceof ArrayBuffer) {
                    console.error(data);
                    console.log(ab2str(data))
                    term.write(ab2str(data))
                }
            }
            term.onData((data) => {
                console.log(data);
                socket.emit('terminalData', {
                    data
                });
            });

            socket.emit('terminalData', {
                data: '\n'
            });

            return () => {
                socket.off("terminal")
            }
        }, [terminalRef]);

        return <div style={{width: "40vw", height: "100px", textAlign: "left"}} ref={terminalRef}>
            
        </div>
    }