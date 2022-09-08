import {describe, test} from 'vitest';
import {createSocket, launchBrowser} from './utils';

describe('API', () => {

    test('Should emit the "killed" event on close', async () => {
        const {browser, page} = await launchBrowser();
        const socket = createSocket();

        await page.evaluate(`
            new Promise(resolve => {
                const client = new GracefulWebSocket('ws://localhost:8088');
                client.addEventListener('killed', resolve);

                setTimeout(() => client.close(), 2000)
            });
        `);

        await browser.close();
        await socket.close();
    });

    test('Should return false for isConnected if it\'s disconnected', async () => {
        const {browser, page} = await launchBrowser();
        const socket = createSocket();

        await page.exposeFunction(
            'closeServer',
            () => socket.close()
        );

        await page.evaluate(`
             new Promise((resolve, reject) => {
                const client = new GracefulWebSocket({
                    pingInterval: 250,
                    pingTimeout: 500,
                    ws: {
                        url: 'ws://localhost:8088'
                    }
                });

                let closeServerPromise;
                client.addEventListener('disconnected', () => {
                    if (client.connected === false) {
                        closeServerPromise.then(resolve);
                    } else {
                        reject();
                    }
                });

                setTimeout(() => closeServerPromise = closeServer(), 2000);
            });
        `);

        await browser.close();
    });
});

