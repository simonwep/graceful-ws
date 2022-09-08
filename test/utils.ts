import puppeteer, {Browser, Page} from 'puppeteer';
import {WebSocketServer} from 'ws';
import {Communication} from '../src/types';

export const launchBrowser = async (): Promise<{
    browser: Browser;
    page: Page;
}> => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.addScriptTag({
        path: './lib/graceful-ws.min.js'
    });

    return {browser, page};
};

export const createSocket = (com: Communication = {
    answer: '__PONG__',
    message: '__PING__'
}) => {
    const socket = new WebSocketServer({port: 8088});

    socket.addListener('connection', client => {
        client.on('message', data => {
            if (data.toString() === com.message) {
                client.send(com.answer);
            }
        });
    });

    return {
        close: () => new Promise<void>((resolve, reject) => {
            socket.on('close', resolve);
            socket.clients.forEach(client => client.close());
            socket.close(err => err ? reject(err) : undefined);
        })
    };
};


