'use strict'

const { Worker } = require('worker_threads')

const path = require('path');
const __NAME = 'MAIN';
const logger = require('./utils/logger')(__NAME);

// Worker Threads
let tradeReaderWorker, fsmWorker, webSocketWorker;
function startTradeReaderWorker() {
    const __NAME = 'TRADE_WORKER';
    tradeReaderWorker = new Worker(path.join(__dirname, './trade-reader.js'), { workerData: { __NAME } });
    tradeReaderWorker.on('message', (data) => {
        if (data.type == 'TRADE') {
            fsmWorker.postMessage(data)
        }
        // Do handling for other kind of messages
    });
    tradeReaderWorker.on('error', (err) => {
        console.error(err);
    });
    tradeReaderWorker.on('exit', (code) => {
        if (code !== 0) {
            throw new Error(`${__NAME} stopped with exit code ${code} `);
        }
    })
}

function startFSMWorker() {
    const __NAME = 'FSM_WORKER';
    fsmWorker = new Worker(path.join(__dirname, './fsm.js'), { workerData: { __NAME } });
    fsmWorker.on('message', (data) => {
        if (data.type == 'OHLC_NOTIFY') {
            webSocketWorker.postMessage(data)
        }
    });
    fsmWorker.on('error', (err) => {
        console.error(err);
    });
    fsmWorker.on('exit', (code) => {
        if (code !== 0) {
            throw new Error(`${__NAME} stopped with exit code ${code} `)
        }
    })
}

function startWebSocketServer() {
    const __NAME = 'WEB_SOCKET_WORKER';
    webSocketWorker = new Worker(path.join(__dirname, './web-socket.js'), { workerData: { __NAME } });
    webSocketWorker.on('message', (data) => {

    });
    webSocketWorker.on('error', (err) => {
        console.error(err);
    });
    webSocketWorker.on('exit', (code) => {
        if (code !== 0) {
            throw new Error(`${__NAME} stopped with exit code ${code} `)
        }
    })
    logger.log(`Started`);
}

startWebSocketServer();
startFSMWorker();
startTradeReaderWorker();