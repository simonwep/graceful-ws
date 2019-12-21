import puppeteer, {Browser, Page} from 'puppeteer';
import {Server}                   from 'ws';
import {Communication}            from '../../src/types';

export const launchBrowser = async (): Promise<{
    browser: Browser;
    page: Page;
}> => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.addScriptTag({
        path: './dist/graceful-ws.min.js'
    });

    return {browser, page};
};

export const createSocket = (com: Communication = {
    answer: '__PONG__',
    message: '__PING__'
}): Server => {
    const socket = new Server({port: 8088});

    socket.addListener('connection', client => {
        client.on('message', data => {
            if (data === com.message) {
                client.send(com.answer);
            }
        });
    });

    return socket;
};


