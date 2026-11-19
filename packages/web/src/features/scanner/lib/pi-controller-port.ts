/** The existing serial provider can use this byte stream without a second command API. */
export class PiControllerPort {
  readonly kind = "pi_zero";
  readable: ReadableStream<Uint8Array> | null = null;
  writable: WritableStream<Uint8Array> | null = null;
  private socket: WebSocket | null = null;
  private readonly url: string;
  private readonly token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  async open(_options: SerialOptions): Promise<void> {
    if (location.protocol === "https:" && !this.url.startsWith("wss:")) {
      throw new Error("An HTTPS app requires a secure wss:// Pi address. See the Pi setup guide.");
    }
    const socket = new WebSocket(this.url);
    this.socket = socket;
    let output!: ReadableStreamDefaultController<Uint8Array>;
    let ended = false;
    this.readable = new ReadableStream({
      start: (controller) => { output = controller; },
      cancel: () => { ended = true; socket.close(); },
    });
    this.writable = new WritableStream({
      write: (bytes) => {
        if (socket.readyState !== WebSocket.OPEN) throw new Error("Pi disconnected");
        if (socket.bufferedAmount > 8192) throw new Error("Pi controller is not responding");
        socket.send(new TextDecoder().decode(bytes).trim());
      },
      close: () => socket.close(),
      abort: () => socket.close(),
    });
    await new Promise<void>((resolve, reject) => {
      let authenticated = false;
      let ready = false;
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error("Pi connection timed out"));
      }, 10000);
      socket.onopen = () => socket.send(JSON.stringify({ token: this.token }));
      socket.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        if (!ready) {
          try {
            const message = JSON.parse(event.data);
            if (message.authenticated === true) authenticated = true;
            else if (authenticated && message.status === "ready" && message.board === "pi_zero") {
              ready = true;
              clearTimeout(timeout);
              resolve();
            }
          } catch { /* Only the authenticated controller handshake is accepted. */ }
          return;
        }
        if (!ended) output.enqueue(new TextEncoder().encode(event.data + "\n"));
      };
      socket.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Could not reach the Pi. Check its address, certificate, and service."));
        socket.close();
      };
      socket.onclose = (event) => {
        clearTimeout(timeout);
        if (!ended) { ended = true; output.close(); }
        reject(new Error(event.reason || "Pi connection closed"));
      };
    });
  }

  async close(): Promise<void> {
    this.socket?.close();
    this.socket = null;
  }
}
