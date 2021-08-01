const {
    RpcDefaultErrorCodes,
    RpcError
} = require('./errors');

module.exports = class Dispatcher {
    constructor(options = {}) {
        this.methods = options.methods || {};

        this.options = {
            parallelBatches: options.parallelBatches !== undefined ? options.parallelBatches : true,
            errorHandler: options.errorHandler || this.defaultErrorHandler.bind(this)
        }
    }

    defaultErrorHandler(err, request) {
        return new RpcError(
            err.code || null,
            err.message || null,
            err.data || null,
            request.id || null
        ).toJsonRpcError();
    }

    setMethods(newMethodsCollection) {
        this.methods = newMethodsCollection;
    }

    register(methodName, handler) {
        this.methods[methodName] = handler;
    }

    makeRpcResponse(result, id) {
        return {
            jsonrpc: '2.0',
            id,
            result
        }
    }

    async callMethod({
        id,
        params,
        method
    }) {
        const handler = this.methods[method];

        if (!handler) throw new RpcError(
            RpcDefaultErrorCodes.MethodNotFound.code,
            RpcDefaultErrorCodes.MethodNotFound.message, {
                method
            },
            id
        );

        const callResult = Array.isArray(params) ? await handler(...params) : await handler(params);

        return id ? this.makeRpcResponse(callResult, id) : null;
    }

    async handleSingleRequest(request) {
        try {
            if (typeof request !== 'object') throw new RpcError(
                RpcDefaultErrorCodes.InvalidRequest.code,
                RpcDefaultErrorCodes.InvalidRequest.message
            );

            if (!request.jsonrpc || request.jsonrpc !== '2.0') {
                throw new RpcError(
                    RpcDefaultErrorCodes.InvalidRequest.code,
                    RpcDefaultErrorCodes.InvalidRequest.message, {
                        field: 'jsonrpc'
                    },
                    request.id
                );
            }

            if (!request.method || typeof request.method !== 'string') {
                throw new RpcError(
                    RpcDefaultErrorCodes.InvalidRequest.code,
                    RpcDefaultErrorCodes.InvalidRequest.message, {
                        field: 'method'
                    },
                    request.id
                );
            }

            const params = request.params || [];

            const result = await this.callMethod({
                id: request.id || null,
                params,
                method: request.method
            });

            return result;
        } catch (err) {
            if (err instanceof RpcError) {
                return err.toJsonRpcError();
            } else {
                return this.options.errorHandler(
                    err, request
                );
            }
        }
    }

    async handle(requestOrBatch) {
        if (!requestOrBatch) {
            return null;
        }

        //If argument is array, this is batch request
        if (Array.isArray(requestOrBatch)) {
            let results = [];

            if (this.options.parallelBatches) {
                //run batch requests in parallel via Promise.all
                //also filter out all non-truthy values
                //because notifications do not return any value
                results = (await Promise.all(
                    requestOrBatch.map(
                        r => this.handleSingleRequest(r)
                    )
                )).filter(value => !!value);

            } else {
                //otherwise process each request 
                //in order, one by one
                for (const request of requestOrBatch) {
                    results.push(
                        await this.handleSingleRequest(request)
                    );
                }
            }

            return results;
        } else if (typeof requestOrBatch === 'object') {
            return this.handleSingleRequest(requestOrBatch);
        }
    }
}