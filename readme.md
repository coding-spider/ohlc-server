# Environment
This required NodeJS version >= 12.13.

# Setup
- cd onlc-server && npm install

# Running the application
- node index.js

# Client Connections and subscribing to instrument
 - wscat -c ws://localhost:3000
 - {"event":"subscribe","symbol":"XXBTZUSD","interval":15}

# Assumptions
- I have assumed that the trades are flowing in realtime based on TS2 time considerations. The 15 second interval is been taken care of fsm.js
- Respective clients connected are notified with the ohlc packets when the bar closes

# Modules
1) trade-reader.js
    This takes care of reading the trade data line by line from the file from data/trades.json file adn send to fsm worker.

2) fsm.js
    This received packets from trade-reader.js and maintains states of all the transaction per instrument basis.

3) web-socket.js
    This takes care of maintaining the the client subscription and sending out the packets the subscribed by the client

4) pubsub.js
    This is simple PubSub class used to manage client subscription