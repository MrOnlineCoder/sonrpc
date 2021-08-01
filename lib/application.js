const http = require('http');

const {
    RpcError,
    RpcDefaultErrorCodes
} = require('./errors');

const Dispatcher = require('./dispatcher');
const Loader = require('./loader');

//Generously copy-pasted from Metacom:
// https://github.com/metarhia/metacom/blob/master/lib/server.js
const receiveBody = async (req) => {
    const buffers = [];
    for await (const chunk of req) {
        buffers.push(chunk);
    }
    return Buffer.concat(buffers).toString();
};

const JsonMimeType = 'application/json';

module.exports = class Application {
    constructor(options = {}) {
        this.options = {
            apiUrl: options.apiUrl || '/api',
            httpPort: options.httpPort || 3000,
            apiDir: options.apiDir || './api',
            requireContentType: options.requireContentType || true,
        };

        this.dispatcher = new Dispatcher(options);
        this.loader = new Loader(options);
    }

    async processRequest(req, res) {
        const contentType = req.headers['content-type'];

        let reply = null;

        if (this.options.requireContentType) {
            if (contentType !== JsonMimeType) {
                reply = new RpcError(
                    RpcDefaultErrorCodes.InvalidRequest.code,
                    RpcDefaultErrorCodes.InvalidRequest.message, {
                        header: 'Content-Type'
                    }
                ).toJsonRpcError();
            }
        }

        if (!reply) {
            const rawBody = await receiveBody(req);

            let parsedBody = null;

            try {
                parsedBody = JSON.parse(
                    rawBody
                );
            } catch (jsonParseError) {
                reply = new RpcError(
                    RpcDefaultErrorCodes.ParseError.code,
                    RpcDefaultErrorCodes.ParseError.message, {
                        json: jsonParseError.message
                    }
                ).toJsonRpcError();

                earlyError = true;
            }

            if (parsedBody) {
                reply = await this.dispatcher.handle(
                    parsedBody
                );
            }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        if (reply) res.write(
            JSON.stringify(reply)
        );
        res.end();
    }

    async launch() {
        if (!this.options.methods) {
            const loadedMethods = await this.loader.load();

            this.dispatcher.setMethods(loadedMethods);
        }

        this.httpServer = http.createServer(this.processRequest.bind(this));

        return new Promise((resolve, reject) => {
            this.httpServer.listen(this.options.httpPort, () => {
                resolve();
            })
        });
    }
};