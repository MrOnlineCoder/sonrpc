const RpcDefaultErrorCodes = {
    ParseError: {
        code: -32700,
        message: 'Parse error'
    },
    InvalidRequest: {
        code: -32600,
        message: 'Invalid Request'
    },
    MethodNotFound: {
        code: -32601,
        message: 'Method not found'
    },
    InvalidParams: {
        code: -32602,
        message: 'Invalid params'
    },
    InternalError: {
        code: -32603,
        message: 'Internal error'
    }
};

class RpcError extends Error {
    constructor(code, message, data, id) {
        super(message);
        this.code = code;
        this.message = message;
        this.data = data;
        this.id = id;
    }

    toJsonRpcError() {
        const result = {
            jsonrpc: "2.0",
            error: {
                code: this.code,
                message: this.message,
            },
            id: this.id || null,
        }

        if (this.data) result.error.data = this.data;

        return result;
    }
}



module.exports = {
    RpcDefaultErrorCodes,
    RpcError
}