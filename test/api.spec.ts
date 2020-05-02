import {createSocket, launchBrowser} from './tools/create-suite';

describe('API', () => {

    it('Should emit the "killed" event on close', async () => {
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
        socket.close();
    });

    it('Should return false for isConnected if it\'s disconnected', async () => {
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

                client.addEventListener('disconnected', () => {
                    if (client.connected === false) {
                        resolve();
                    } else {
                        reject();
                    }
                });

                setTimeout(() => closeServer(), 2000);
            });
        `);

        await browser.close();
    });
});

