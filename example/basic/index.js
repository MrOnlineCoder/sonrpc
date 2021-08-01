const sonrpc = require('../../index');

const app = new sonrpc.Application({
    apiDir: './rpc',
    apiUrl: '/api',
    httpPort: 5000,
    useRequire: false
});

async function run() {
    await app.launch();

    console.log(`sonrpc application started.`);
}

run();