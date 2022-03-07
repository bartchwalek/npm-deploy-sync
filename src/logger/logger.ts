import fs from 'fs';

const ROOTCLASSNAME = 'DeployRsync';

const DEBUG_LEVEL = 1;
const LOG_LEVEL = 1;
export const DEBUG = () => DEBUG_LEVEL > 0;
export const LOG = () => LOG_LEVEL > 0;
const LOG_FILE_PATH = 'deploy-sync.log';

export const DEBUGGER = (caller, ...args) => {
    DEBUG() && console.log(...args);
    LOG() && LOGGER(caller, ...args);
};

let LOGFILE_OPEN = false;
let LOGFILE_ERR = false;
let LOGSTREAM;
export const LOGGER = (caller, ...args) => {
    // log to file.
    if (!LOGFILE_OPEN) {
        LOGSTREAM = fs.createWriteStream(LOG_FILE_PATH, {flags: 'a'});
    }
    let isRef = false;
    let hash;
    if (caller && caller.getHash) {
        hash = caller.getHash();
        isRef = true;
    }
    let classname;
    if (caller && caller.classname) {
        classname = caller.classname;
        isRef = true;
    }

    if (!isRef) {
        isRef = (typeof caller === 'function'); // don't try to render functions/classes as strings in case caller is this.
    }

    !LOGFILE_ERR && LOGSTREAM.write(`[${ROOTCLASSNAME}] ${classname ? '[' + classname + ']' : ''} ${hash ? '[' + hash + ']' : ''} [${(new Date()).toISOString()}] :: ${isRef ? '' : caller} ${args.join(' ')}\n`);
};
