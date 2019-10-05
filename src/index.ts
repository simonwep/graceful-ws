import {Communication, EventListenerBuffer, Options, WebsocketSettings} from './types';

export default class extends EventTarget {

    // Settings
    private readonly websocketSettings: WebsocketSettings;
    private readonly com: Communication;

    private _pingInterval: number;
    private _pingTimeout: number;
    private _retryInterval: number;
    private websocket: WebSocket | null;

    // Instance stuff
    private readonly eventListeners: Array<EventListenerBuffer>;
    private _pingingTimeout: number;
    private _disconnectionTimeout: number;

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

        this.com = com;
        this.websocketSettings = ws;
        this.websocket = null;
        this.eventListeners = [];
        this.start();
    }

    private start(): void {
        const {eventListeners, com, _pingInterval, _pingTimeout} = this;
        const {url, protocol} = this.websocketSettings;
        const ws = this.websocket = new WebSocket(url, protocol || []);

        ws.addEventListener('open', () => {

            // Add event listener
            for (const args of eventListeners) {
                ws.addEventListener(...args);
            }

            // Ping every 5s
            this._pingingTimeout = setInterval(() => {
                ws.send(com.message);

                this._disconnectionTimeout = setTimeout(() => {
                    ws.close();
                    clearInterval(this._pingingTimeout);
                }, _pingTimeout);
            }, _pingInterval);

            ws.dispatchEvent(new Event('connected'));
        });

        ws.addEventListener('message', e => {

            // Check if message is the answer of __ping__ stop propagation if so
            if (e.data === com.answer) {
                clearTimeout(this._disconnectionTimeout);
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        });

        ws.addEventListener('close', () => this.restart());
    }

    private restart(): void {
        const {websocket, _retryInterval, _pingingTimeout, _disconnectionTimeout} = this;

        // Dispatch custom event
        websocket.dispatchEvent(new Event('disconnected'));

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
        const {websocket, eventListeners} = this;

        // If websocket is open and present, directly attach it
        if (websocket && websocket.readyState === websocket.OPEN) {
            websocket.addEventListener(type, listener, options);
        }

        // Keep bound event listener
        eventListeners.push([type, listener, options]);
    }

    public removeEventListener(type: string, callback: EventListener | EventListenerObject | null, options?: EventListenerOptions | boolean): void {
        const {websocket, eventListeners} = this;

        // If websocket is open and present, directly unbind it
        if (websocket && websocket.readyState === websocket.OPEN) {
            websocket.addEventListener(name, callback, options);
        }

        // Find stored event-listener arguments
        const index = eventListeners.findIndex(([t, c, o]) => {
            return t === type && c === callback && o === options;
        });

        if (~index) {
            eventListeners.splice(index, 1);
        }
    }

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        const {websocket} = this;

        if (websocket) {
            websocket.send(data);
        } else {
            throw 'Websocket isn\'t created yet.';
        }
    }

    public close(code?: number, reason?: string): void {
        const {websocket} = this;

        if (websocket) {
            websocket.close(code, reason);
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
}
