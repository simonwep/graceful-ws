export type WebsocketSettings = {
    url: string;
    protocol?: string | Array<string>;
}

export type Communication = {
    message: string;
    answer: string;
}

export type Options = {

    // Websocket related settings (https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket)
    ws: WebsocketSettings;
    com: Communication;

    pingTimeout: number;
    pingInterval: number;
    retryInterval: number;
};

export type EventListenerBuffer = [
    string,
    EventListener | EventListenerObject | null,
    boolean | AddEventListenerOptions
]
