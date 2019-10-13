import {Communication, EventListenerBuffer, Options, WebsocketSettings} from './types';


export default class extends EventTarget {

    // Settings
    private readonly _websocketSettings: WebsocketSettings;
    private readonly _com: Communication;

    private _pingInterval: number;
    private _pingTimeout: number;
    private _retryInterval: number;
    private _websocket: WebSocket | null;

    // Instance stuff
    private readonly _eventListeners: Array<EventListenerBuffer>;
    private _pingingTimeout: number;
    private _disconnectionTimeout: number;
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
        this._eventListeners = [];
        this.start();
    }

    private start(): void {
        const {_eventListeners, _com, _pingInterval, _pingTimeout} = this;
        const {url, protocol} = this._websocketSettings;
        const ws = this._websocket = new WebSocket(url, protocol || []);

        ws.addEventListener('open', () => {

            // Add event listener
            for (const args of _eventListeners) {
                ws.addEventListener(...args);
            }

            // Ping every 5s
            this._pingingTimeout = setInterval(() => {
                ws.send(_com.message);

                this._disconnectionTimeout = setTimeout(() => {
                    ws.close();
                    clearInterval(this._pingingTimeout);
                }, _pingTimeout);
            }, _pingInterval);

            ws.dispatchEvent(new Event('connected'));
        });

        ws.addEventListener('message', e => {

            // Check if message is the answer of __ping__ stop propagation if so
            if (e.data === _com.answer) {
                clearTimeout(this._disconnectionTimeout);
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        });

        ws.addEventListener('close', () => {
            if (!this._closed) {
                this.restart();
            }
        });
    }

    private restart(): void {
        const {_websocket, _retryInterval, _pingingTimeout, _disconnectionTimeout} = this;

        // Dispatch custom event
        _websocket.dispatchEvent(new Event('disconnected'));

        // Clear pinging and disconnected timeouts and intervals
        clearInterval(_pingingTimeout);
        clearTimeout(_disconnectionTimeout);

        // Check every second if ethernet is available
        const retry = setInterval(() => {
            if (navigator.onLine) {
                clearInterval(retry);
                this.start();
            }
        }, _retryInterval);
    }


    public addEventListener(type: string, listener: EventListener | EventListenerObject | null, options?: boolean | AddEventListenerOptions): void {
        const {_websocket, _eventListeners} = this;

        // If websocket is open and present, directly attach it
        if (_websocket && _websocket.readyState === _websocket.OPEN) {
            _websocket.addEventListener(type, listener, options);
        }

        // Keep bound event listener
        _eventListeners.push([type, listener, options]);
    }

    public removeEventListener(type: string, callback: EventListener | EventListenerObject | null, options?: EventListenerOptions | boolean): void {
        const {_websocket, _eventListeners} = this;

        // If websocket is open and present, directly unbind it
        if (_websocket && _websocket.readyState === _websocket.OPEN) {
            _websocket.addEventListener(name, callback, options);
        }

        // Find stored event-listener arguments
        const index = _eventListeners.findIndex(([t, c, o]) => {
            return t === type && c === callback && o === options;
        });

        if (~index) {
            _eventListeners.splice(index, 1);
        }
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
        const {_websocket} = this;

        if (_websocket) {
            this._closed = true;
            _websocket.close(code, reason);
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
