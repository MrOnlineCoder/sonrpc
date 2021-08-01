const sonrpc = require('../../index');

const app = new sonrpc.Application();

(async() => {
    await app.launch();

    console.log(`Todo RPC app started.`)
})();