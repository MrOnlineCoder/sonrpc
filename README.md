# sonrpc

Minimalistic library for creating [JSON-RPC 2.0](https://www.jsonrpc.org/specification) API

## Getting Started

```javascript
//api/greet.js
module.exports = async ({
    name,
    city
}) => {
    return `Hi, ${name} from ${city}!`;
};
```

```javascript
//index.js
const sonrpc = require('sonrpc');

const app = new sonrpc.Application();

app.launch();
```

Testing out, request to `http://localhost:3000/api`:
```json
{
    "jsonrpc": "2.0",
    "method": "greet",
    "id": "1",
    "params": {
        "name": "John",
        "city": "London"
    }
}
```

Response:

```json
{
    "jsonrpc": "2.0",
    "id": "1",
    "result": "Hi, John from London!"
}
```

See `/example` for more details

## Modules

The `Application` class used in the example above is a built-in `http` server which accepts JSON-RPC requests in HTTP body. It also handles such cases as invalid JSON body in the request.

However, if you want to use JSON-RPC calls via any other transport (WebSockets, TCP) or platform (express, fastify), you can use just the `Dispatcher` class from `sonrpc`, which does all the handling of the RPC calls.

## Configuration

**Available `sonrpc.Application` options and their default values:**

```javascript
new sonrpc.Application({
    //HTTP URL where the requests will be processed 
    apiUrl: '/api',

    //HTTP port to start the server on
    httpPort: 3000,

    //Is 'application/json' content type required for incoming requests
    //If true and the header is not valid, a JSON-RPC error will be returned
    requireContentType: true,
});
```

Other options are automatically passed to `Dispatcher` and `Loader` objects.

**Available `sonrpc.Dispatcher` options and their default values:**

```javascript
new sonrpc.Dispatcher({
    //Object with each property mapping to a method
    //<methodName, function>
    methods: {},

    //If true, batch requests are processed in parallel
    parallelBatches: true,

    //Error handler for non-RPC errors
    //signature: (error, request)
    //where 'error' is the error thrown 
    //'request' is JSON RPC 'Request' object
    //must return JSON-RPC 'Error' object

    //default error handler just
    //puts the error.message as JSON-RPC error message
    //and error.code as JSON-RPC error code (or null if omitted)
    errorHandler: defaultErrorHandler
});
```

**Available `sonrpc.Loader` options and their default values:**

```javascript
new sonrpc.Loader({
    //If true, node.js 'require()' will be used for loading methods
    //Otherwise, node.js 'vm' module will be used
    //See below for more details
    useRequire: true,
    
    //Directory to search for RPC methods
    apiDir: './api',

    //Delimeter for method namespaces
    //If there is add.js file in math/ folder
    //The final method name will be 'math.add'
    namespaceDelimeter: '.'
});
```

## Methods and method loading

In sonrpc, each method handler is just a simple `async` function. The parameters are passed either as an object, or as an array of arguments:

```js
//As array
//params: [2,3]
async (a,b) => {
    return a + b;
};

//As object
//params: {a: 2, b: 3}
async ({
    a,b
}) => {
    return a + b;
};
```

The call is successfull if handler returns any value that can be serialized to JSON, then it is sent as `result` in `JSON-RPC response` object.

If error is thrown, the call is not successfull and `JSON-RPC error` object is sent back to client.

By default, `sonrpc.Loader` loades the method handlers via `require()`, so each method is just basically a module:

```
//api/method.js
module.exports = async (param1, param2) => {
    return ...;
};
```

But, you can disable this feature by providing `useRequire: false` option. In that case, node.js `vm` (and `vm.Script` to be specific) module capabilites will be used for loading and running method handlers. 
Also, the method definition changes a bit (`module.exports` is omitted):
```javascript
async (param1, param2) => {
    return ...;
};
```

This is shorter and more convenient way. However, the script is run in separate scope, so such tools as `require` or `module` are not available. Therefore, a some sort of dependency injection must be added.


### Author: Nikita Kogut (MrOnlineCoder)

### License: MIT