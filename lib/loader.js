const fsp = require('fs/promises');
const vm = require('vm');
const path = require('path');

const stdModule = require('module')

module.exports = class Loader {
    constructor(options = {}) {
        this.options = {
            useRequire: options.useRequire !== undefined ? options.useRequire : true,
            apiDir: options.apiDir || './api',
            namespaceDelimeter: options.namespaceDelimeter || '.'
        }

        if (!path.isAbsolute(this.options.apiDir)) {
            this.options.apiDir = path.join(
                process.cwd(),
                this.options.apiDir
            );
        }

        this.methods = {};
    }

    buildVmHandler(codeBuffer) {
        const code = codeBuffer.toString('utf-8');

        const script = new vm.Script(
            code, {
                timeout: 10000
            }
        );
        const func = script.runInThisContext();

        return func;
    }

    async loadDirectory(prefix, dirPath) {
        const list = await fsp.readdir(dirPath);

        for (const filepath of list) {
            const fullFilepath = path.join(dirPath, filepath);
            const fileStat = await fsp.stat(fullFilepath);

            if (fileStat.isDirectory()) {
                const namespacePrefix = prefix + filepath + this.options.namespaceDelimeter;

                await this.loadDirectory(namespacePrefix, fullFilepath);
            } else {
                const parsedFilepath = path.parse(filepath);
                const fullMethodName = prefix + parsedFilepath.name;

                if (this.options.useRequire) {
                    const handler = require(fullFilepath);

                    if (typeof handler !== 'function') {
                        throw new TypeError(`Method handler file '${fullMethodName}' must export a function to be a valid method handler`);
                    }

                    this.methods[fullMethodName] = handler;
                } else {
                    const fileContents = await fsp.readFile(fullFilepath);

                    this.methods[fullMethodName] = this.buildVmHandler(
                        fileContents
                    );
                }
            }
        }
    }

    async load() {
        await this.loadDirectory(
            '',
            this.options.apiDir
        );

        return this.methods;
    }
};