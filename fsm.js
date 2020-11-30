'use strict';

const { workerData, parentPort } = require('worker_threads');
const { __NAME } = workerData;
const logger = require('./utils/logger')(__NAME);

const INTERVAL = 15 * 1000;
const QUEUE_PROCESSOR_INTERVAL = 50;


let scrips = {}

parentPort.on('message', (data) => {
    // logger.log(`Message received > `, data);
    if (data.type == 'TRADE') {
        addTrade(data.data);
    }
})

function addTrade(trade) {
    let scrip = scrips[trade.sym];

    if (!scrip) {
        // Create new scrip
        scrips[trade.sym] = {
            symbol: trade.sym,
            ohlcData: [],
            currentOHLC: {
                bar_num: 1
            },
            previousClose: null,
            bar_num: 1,
            queue: [],
            intervalChecker: null,
            queueProcessor: null,
            currentStartTime: null,
            firstTradeTime: null
        }

        scrip = scrips[trade.sym];

        scrip.intervalChecker = setInterval(() => {
            scrip.queue.unshift({ type: 'INTERVALEXPIRY' })
        }, INTERVAL)

        scrip.queueProcessor = setInterval(() => {

            while (scrip.queue.length > 0) {

                let item;

                // All times are in ms
                if (scrip.firstTradeTime == null && scrip.queue[0].type == 'TRADE') {
                    item = scrip.queue.shift();
                    scrip.currentStartTime = new Date().getTime()
                    scrip.firstTradeTime = formatTime(item.data.TS2);
                } else if (scrip.queue[0].type == 'INTERVALEXPIRY') {
                    item = scrip.queue.shift();
                } else if (scrip.queue[0].type == 'TRADE' && simulateTrade(scrip, scrip.queue[0].data)) {
                    item = scrip.queue.shift();
                }


                if (!item) {
                    break;
                }

                // console.log('Procesing...');
                // console.log(item);

                if (item.type == 'TRADE') {
                    // New TRADE
                    let newOHLC = computeOHLC(item.data, scrip.currentOHLC, scrip.bar_num);
                    scrip.previousClose = item.data.P;
                    scrip.currentOHLC = newOHLC;

                } else if (item.type == 'INTERVALEXPIRY') {
                    // If the interval has expired

                    // Add close value
                    if (scrip.previousClose != null) {
                        scrip.currentOHLC.c = scrip.previousClose;
                    }

                    // Add symbol and trigger event
                    let currentOHLC = Object.assign({}, scrip.currentOHLC);
                    currentOHLC.symbol = scrip.symbol;
                    scrip.ohlcData.push(currentOHLC);

                    triggerOHLCNotify(currentOHLC);

                    // Increment bar_num
                    scrip.bar_num += 1;

                    // Reset values
                    scrip.currentOHLC = { bar_num: scrip.bar_num };
                    scrip.previousClose = null;
                }
            }

        }, QUEUE_PROCESSOR_INTERVAL)
    }

    scrip.queue.push({ type: 'TRADE', data: trade });

}

function simulateTrade(scrip, trade) {
    return (formatTime(trade.TS2) - scrip.firstTradeTime) <= (new Date().getTime() - scrip.currentStartTime);
}

function formatTime(t) {
    return t / 1000000;
}

function triggerOHLCNotify(ohlc) {
    parentPort.postMessage({ type: 'OHLC_NOTIFY', data: ohlc });
}

function computeOHLC(trade, currentOHLC, bar_num) {
    let newOHLC = {};
    if (currentOHLC.o === undefined) {
        // Creating for first time
        newOHLC.o = trade.P;
        newOHLC.h = -Infinity;
        newOHLC.l = Infinity;
        newOHLC.c = 0;
        newOHLC.volume = 0;
    } else {
        newOHLC = Object.assign(newOHLC, currentOHLC);
    }

    newOHLC.h = Math.max(newOHLC.h, trade.P);
    newOHLC.l = Math.min(newOHLC.l, trade.P);

    newOHLC.volume = (currentOHLC.volume || 0) + trade.Q;

    newOHLC.bar_num = bar_num;

    return newOHLC;
}