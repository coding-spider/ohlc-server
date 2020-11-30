'use strict';

const { workerData, parentPort } = require('worker_threads');
const { __NAME } = workerData;
const logger = require('./utils/logger')(__NAME);
const WebSocket = require('ws');
const PubSub = require('./pubsub');
const PORT = 3000;

parentPort.on('message', (data) => {
    // logger.log(`Message received > `, data);
    if (data.type == 'OHLC_NOTIFY') {
        PubSub.publish(data.data.symbol, data.data)
    }
})

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', function connection(ws) {
    logger.log('New Client Connected!');

    // handle subscription
    ws.on('message', function incoming(data) {
        logger.log('data', data);

        try {
            data = JSON.parse(data);
        } catch (e) {
            // logger.error(e);
            return;
        }

        const { event, symbol, interval } = data;

        switch (event) {
            case 'subscribe':
                PubSub.subscribe(ws, symbol, interval);
                break;
        }
    });

    ws.on('close', () => {
        // @TODO: unsubscribe channel on disconnecting
        logger.log(`Client Disconnecting`)
    });
});