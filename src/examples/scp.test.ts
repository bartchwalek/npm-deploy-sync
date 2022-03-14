import {Scp, ScpExecutionResults} from '../scp';
import {ExecutionController} from '../command-shell';

/**
 * An example for using SCP
 * Use your <user> <password> <localpath> <remotehost> <remotepath> <port>
 *
 *     By default, this is a local loop copy test between ~/transmit and ~/receive.
 */

const scp = new Scp(0);

const remotehost = 'localhost';
const user = process.env.USER;
const password = process.argv[2];
const remotepath = `/home/${user}/receive/`;
const localpath = `/home/${user}/transmit/`;

let myScp = scp.from(localpath)
    .as(user)
    .to(remotehost)
    .password(password)
    .into(remotepath)
    .port(22)
    .recursive()
    .verbose();

scp.getProcess('FirstCopy').then((ec: ExecutionController) => {
    ec.catch('debug', (err) => {
        // console.log('Filtering: ', err.toString());
    });
    ec.onClose((data) => {
        console.log('Closed process FirstCopy ', data);
    });
});

scp.getProcess('AnotherCopy').then((ec: ExecutionController) => {
    ec.catch('debug', (err) => {
        // console.log('Filtering: ', err.toString());
    });
    ec.onClose((data) => {
        console.log('Closed process AnotherCopy ', data);
    });
});

myScp.copy('FirstCopy').then((res: ScpExecutionResults) => {
    console.log(`Process FirstCopy Command ${res.success ? 'success' : 'fail'}`);
    console.log('Result: ', res);
});

myScp.copy('AnotherCopy').then((res: ScpExecutionResults) => {
    console.log(`Process AnotherCopy Command ${res.success ? 'success' : 'fail'}`);
    console.log('Result: ', res);
});






