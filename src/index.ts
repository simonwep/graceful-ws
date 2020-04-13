import {Options, WebsocketSettings} from './types';

export default class GracefulWebSocket extends EventTarget {

    // Version
    public static readonly version = VERSION;

    // Default options
    private readonly _options: Options = {
        ws: {
            protocols: [],
            url: ''
        },
        pingInterval: 5000,
        pingTimeout: 2500,
        retryInterval: 1000,
        com: {
            message: '__PING__',
            answer: '__PONG__'
        }
    };

    // Instance stuff
    private _closed = false;
    private _websocket: WebSocket | null = null;

    // Timing id's
    private _disconnectionTimeoutId = 0;
    private _pingingTimeoutId = 0;
    private _retryIntervalId = 0;

    constructor(
        url: (Partial<Options> & {ws: WebsocketSettings}) | string,
        ...protocols: Array<string>
    ) {
        super();

        const {_options} = this;
        if (typeof url === 'string') {
            _options.ws = {
                url,
                protocols
            };
        } else {
            Object.assign(_options, url);
        }

        if (!_options.ws || !_options.ws.url) {
            throw new Error('You must provide at least a websocket url.');
        }

        this._websocket = null;
        this.start();
    }

    get pingInterval(): number {
        return this._options.pingInterval;
    }

    set pingInterval(value: number) {
        this._options.pingInterval = value;
    }

    get pingTimeout(): number {
        return this._options.pingTimeout;
    }

    set pingTimeout(value: number) {
        this._options.pingTimeout = value;
    }

    get retryInterval(): number {
        return this._options.retryInterval;
    }

    set retryInterval(value: number) {
        this._options.retryInterval = value;
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

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        const {_websocket} = this;

        if (_websocket) {
            _websocket.send(data);
        } else {
            throw new Error('Websocket isn\'t created yet.');
        }
    }

    public close(code?: number, reason?: string): void {
        const {_websocket, _pingingTimeoutId, _disconnectionTimeoutId, _retryIntervalId} = this;

        if (this._closed) {
            throw new Error('Websocket already closed.');
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
            throw new Error('Websocket isn\'t created yet.');
        }
    }

    private start(): void {
        const {com, pingInterval, pingTimeout, ws: {url, protocols}} = this._options;
        const ws = this._websocket = new WebSocket(url, protocols || []);

        ws.addEventListener('open', () => {
            super.dispatchEvent(new CustomEvent('connected'));

            // Ping every 5s
            this._pingingTimeoutId = setInterval(() => {
                ws.send(com.message);

                this._disconnectionTimeoutId = setTimeout(() => {
                    ws.close();
                    clearInterval(this._pingingTimeoutId);
                }, pingTimeout) as unknown as number;
            }, pingInterval) as unknown as number;
        });

        ws.addEventListener('message', e => {

            // Check if message is the answer of __ping__ stop propagation if so
            if (e.data === com.answer) {
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

        // Dispatch custom event
        super.dispatchEvent(new CustomEvent('disconnected'));

        // Clear pinging and disconnected timeouts and intervals
        clearInterval(this._pingingTimeoutId);
        clearTimeout(this._disconnectionTimeoutId);

        // Check every second if ethernet is available
        this._retryIntervalId = setInterval(() => {
            if (navigator.onLine) {
                clearInterval(this._retryIntervalId);
                this.start();
            }
        }, this._options.retryInterval) as unknown as number;
    }
}
