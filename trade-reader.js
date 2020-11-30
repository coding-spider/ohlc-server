'use strict';

const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { workerData, parentPort } = require('worker_threads');
const { __NAME } = workerData;
const logger = require('./utils/logger')(__NAME);


const DATA_FILE_PATH = path.resolve('./data/trades.json');

const lineReader = readline.createInterface({
    input: fs.createReadStream(DATA_FILE_PATH)
});

lineReader.on('line', function (line) {
    parentPort.postMessage({ type: 'TRADE', data: JSON.parse(line) });
});