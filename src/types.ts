export type WebsocketSettings = {
    protocol?: string | Array<string>;
    url: string;
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
