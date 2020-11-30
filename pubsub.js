'use strict';

class PubSub {
    constructor() {
        this.channels = {};
    }

    createChannel(channel) {
        if (!this.channels[channel]) {
            this.channels[channel] = {
                subscribers: []
            };
        }
    }

    subscribe(subscriber, channel, interval) {
        if (!this.channels[channel]) {
            this.createChannel(channel);
        }
        this.channels[channel].subscribers.push(subscriber);
    }

    publish(channel, message) {
        if (!this.channels[channel]) {
            this.createChannel(channel);
        }
        const channelObj = this.channels[channel];
        channelObj.subscribers.forEach(subscriber => {
            subscriber.send(JSON.stringify(message));
        });
    }
}

module.exports = new PubSub();