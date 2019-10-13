import {Communication, Options, WebsocketSettings} from './types';

export default class extends EventTarget {

    // Settings
    private readonly _websocketSettings: WebsocketSettings;
    private readonly _com: Communication;

    private _pingInterval: number;
    private _pingTimeout: number;
    private _retryInterval: number;
    private _websocket: WebSocket | null;

    // Instance stuff
    private _disconnectionTimeoutId: number;
    private _pingingTimeoutId: number;
    private _retryIntervalId: number;
    private _closed: boolean;

    // Version
    public static readonly version = '1.0.1';

    constructor(
        {
            ws,
            pingInterval = 5000,
            pingTimeout = 2500,
            retryInterval = 1000,
            com = {
                message: '__PING__',
                answer: '__PONG__'
            }
        }: Options
    ) {
        super();
        this._pingInterval = pingInterval;
        this._pingTimeout = pingTimeout;
        this._retryInterval = retryInterval;

        if (!ws) {
            throw 'You must provide at least a websocket url.';
        }

        this._com = com;
        this._websocketSettings = ws;
        this._websocket = null;
        this.start();
    }

    private start(): void {
        const {_com, _pingInterval, _pingTimeout} = this;
        const {url, protocol} = this._websocketSettings;
        const ws = this._websocket = new WebSocket(url, protocol || []);

        ws.addEventListener('open', () => {
            super.dispatchEvent(new CustomEvent('connected'));

            // Ping every 5s
            this._pingingTimeoutId = setInterval(() => {
                ws.send(_com.message);

                this._disconnectionTimeoutId = setTimeout(() => {
                    ws.close();
                    clearInterval(this._pingingTimeoutId);
                }, _pingTimeout);
            }, _pingInterval);
        });

        ws.addEventListener('message', e => {

            // Check if message is the answer of __ping__ stop propagation if so
            if (e.data === _com.answer) {
                clearTimeout(this._disconnectionTimeoutId);
            } else {
                super.dispatchEvent(new MessageEvent('message', e as EventInit));
            }
        });

        ws.addEventListener('close', () => {
            if (!this._closed) {
                this.restart();
            }
        });
    }

    private restart(): void {
        const {_retryInterval, _pingingTimeoutId, _disconnectionTimeoutId} = this;

        // Dispatch custom event
        super.dispatchEvent(new CustomEvent('disconnected'));

        // Clear pinging and disconnected timeouts and intervals
        clearInterval(_pingingTimeoutId);
        clearTimeout(_disconnectionTimeoutId);

        // Check every second if ethernet is available
        this._retryIntervalId = setInterval(() => {
            if (navigator.onLine) {
                clearInterval(this._retryIntervalId);
                this.start();
            }
        }, _retryInterval);
    }


    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        const {_websocket} = this;

        if (_websocket) {
            _websocket.send(data);
        } else {
            throw 'Websocket isn\'t created yet.';
        }
    }

    public close(code?: number, reason?: string): void {
        const {_websocket, _pingingTimeoutId, _disconnectionTimeoutId, _retryIntervalId} = this;

        if (this._closed) {
            throw 'Websocket already closed.';
        } else if (_websocket) {
            this._closed = true;

            // Clear timeouts
            clearTimeout(_pingingTimeoutId);
            clearTimeout(_disconnectionTimeoutId);
            clearInterval(_retryIntervalId);

            // Close websocket
            _websocket.close(code, reason);

            // Dispatch close event
            super.dispatchEvent(new CustomEvent('killed'));
        } else {
            throw 'Websocket isn\'t created yet.';
        }
    }


    get pingInterval(): number {
        return this._pingInterval;
    }

    set pingInterval(value: number) {
        this._pingInterval = value;
    }

    get pingTimeout(): number {
        return this._pingTimeout;
    }

    set pingTimeout(value: number) {
        this._pingTimeout = value;
    }

    get retryInterval(): number {
        return this._retryInterval;
    }

    set retryInterval(value: number) {
        this._retryInterval = value;
    }

    // Websocket properties (https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
    get binaryType(): BinaryType | null {
        return this._websocket ? this._websocket.binaryType : null;
    }

    get bufferedAmount(): number | null {
        return this._websocket ? this._websocket.bufferedAmount : null;
    }

    get extensions(): string | null {
        return this._websocket ? this._websocket.extensions : null;
    }

    get protocol(): string | null {
        return this._websocket ? this._websocket.protocol : null;
    }

    get readyState(): number | null {
        return this._websocket ? this._websocket.readyState : null;
    }

    get url(): string | null {
        return this._websocket ? this._websocket.url : null;
    }
}
