import {Communication}               from '../src/types';
import {createSocket, launchBrowser} from './tools/create-suite';

describe('Connection', () => {

    it('Should successfully emit the "connected" event', async () => {
        const {browser, page} = await launchBrowser();
        const socket = createSocket();

        await page.evaluate(`
            new Promise(resolve => {
                const client = new GracefulWebSocket('ws://localhost:8088');
                client.addEventListener('connected', resolve);
            });
        `);

        await browser.close();
        socket.close();
    });

    it('Should emit the "disconnected" event if the server is not longer reachable', async () => {
        const {browser, page} = await launchBrowser();
        const socket = createSocket();

        await page.exposeFunction(
            'closeServer',
            () => socket.close()
        );

        await page.evaluate(`
            new Promise(resolve => {
                const client = new GracefulWebSocket({
                    pingInterval: 500,
                    pingTimeout: 1000,
                    ws: {
                        url: 'ws://localhost:8088'
                    }
                });

                client.addEventListener('disconnected', resolve);
                setTimeout(() => closeServer(), 2000);
            });
        `);

        await browser.close();
    });

    it('Should re-establish a connection', async () => {
        const {browser, page} = await launchBrowser();
        let socket = createSocket();

        // Should connect
        await page.evaluate(`
            new Promise(resolve => {
                client = new GracefulWebSocket('ws://localhost:8088');
                client.addEventListener('connected', resolve, {once: true});
            });
        `);

        await page.exposeFunction(
            'closeServer',
            () => socket.close()
        );

        // Should fire disconnect event
        await page.evaluate(`
            new Promise(resolve => {
                client.addEventListener('disconnected', resolve, {once: true});
                closeServer();
            });
        `);

        await page.exposeFunction(
            'openServer',
            () => socket = createSocket()
        );

        // Should reconnect
        await page.evaluate(`
            new Promise(resolve => {
                client.addEventListener('connected', resolve, {once: true});
                openServer();
            });
        `);

        await browser.close();
        socket.close();
    });

    it('Should accept custom ping / pong messages', async () => {
        const com: Communication = {
            message: 'Hello?',
            answer: 'Whazzup?'
        };

        const {browser, page} = await launchBrowser();
        const socket = createSocket(com);

        // Should stay connected
        const res = await page.evaluate(`
            new Promise(resolve => {
                const client = new GracefulWebSocket({
                    retryInterval: 100,
                    pingInterval: 250,
                    pingTimeout: 750,
                    ws: {
                        url: 'ws://localhost:8088'
                    },
                    com: ${JSON.stringify(com)}
                });

                const timeout = setTimeout(() => resolve('ok'), 3000);
                client.addEventListener('disconnected', () => resolve('error'), {once: true});
            });
        `);

        expect(res).toBe('ok');
        await browser.close();
        socket.close();
    });
});

