const WebSocket = require('ws');
const url = require('url');
const config = require('../config');

class Server {

	constructor(options) {
		this.options = Object.assign({
			pair: 'BTCUSD',
			port: 8080,
			exchange: []
		}, options);

		if (!this.options.exchanges || !this.options.exchanges.length) {
			throw new Error('You need to specify at least one exchange to track');
		}

		this.exchanges = this.options.exchanges;

		this.listen();
		this.connect();

		// setTimeout(this.disconnect.bind(this), 10000);
	}

	listen() {
		this.wss = new WebSocket.Server({
			port: this.options.port
		});

		this.wss.on('listening', (ws, req) =>  {
			console.log('server listening on port ' + this.options.port);
		});

		this.wss.on('connection', (ws, req) =>  {
			const location = url.parse(req.url, true);
			console.log('client ' + req.connection.remoteAddress + ' from ' + req.url);
		});

		this.exchanges.forEach(exchange => {
			exchange.on('data', this.broadcast.bind(this));
		})
	}

	connect() {
		console.log('[server] connect exchange using pair', this.options.pair);

		this.exchanges.forEach(exchange => {
			exchange.connect(this.options.pair);
		});
	}

	broadcast(data) {
		this.wss.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(data));
			}
		});
	}

	disconnect() {
		this.exchanges.forEach(exchange => {
			exchange.disconnect();
		});
	}

}

module.exports = Server;