'use strict';

module.exports = function (__NAME) {
    return {
        log: (msg = 'NO_MSG', data = '', extras = {}) => {
            console.log(`${__NAME} > ${msg} ::: ${JSON.stringify(data)}`);
        },

        error: (error, msg = 'NO_MSG', extras = {}) => {
            console.log(`${__NAME} > Error Occured`);
            console.error(error ? error : `${msg}`);
        }
    }
}