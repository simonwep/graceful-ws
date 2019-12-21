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
});

