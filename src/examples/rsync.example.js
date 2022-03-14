import { Rsync, RsyncFormattedResults } from '../rsync';
import { ExecutionController } from '../command-shell';
import { ScpExecutionResults } from '../scp';

/**
 * An example for using RSync
 * Use your <user> <password> <localpath> <remotehost> <remotepath> <port>
 *
 *     By default it is set up like a local loop test between ~/transmit and ~/receive
 */

const remotehost = 'localhost';
const user = process.env.USER;
const password = process.argv[2];
const remotepath = `/home/${user}/receive/`;
const localpath = `/home/${user}/transmit/`;

const rsync = new Rsync({ useSshPass: true }, 0);
let rs = rsync
  .from(localpath)
  .to(remotehost)
  .into(remotepath)
  .as(user)
  .password(password)
  .archive()
  .update()
  .verbose()
  .exclude('/assets/stub/**');

rs.getProcess('FirstCopy').then((ec: ExecutionController) => {
  ec.catch('debug', (err) => {
    // console.log('Filtering: ', err.toString());
  });
  ec.onClose((data) => {
    // console.log(ec.getDataString());
    console.log('Closed process FirstCopy ', data);
  });
});

// rs.getProcess('AnotherCopy').then((ec: ExecutionController) => {
//     ec.catch('debug', (err) => {
//         // console.log('Filtering: ', err.toString());
//     });
//     ec.onClose((data) => {
//         console.log('Closed process AnotherCopy ', data);
//     });
// });

rs.getFormattedResults('FirstCopy').then((results: RsyncFormattedResults) => {
  console.log('Formatted results:');
  // console.log(results);
  console.log(`Files sent: ${results.formatted.files.list.length}`);
  console.log(
    `${results.formatted.files.sent} ${results.formatted.files.sentType} were sent at ${results.formatted.files.speed} ${results.formatted.files.speedType}`,
  );
  let fl = results.formatted.files.list;
  let firstf = fl.length > 5 ? fl.slice(0, 5) : fl;
  console.log(`Files sent:\n ${firstf.join('\n')}${fl.length > 5 ? '...' : ''}`);
});

rs.sync('FirstCopy').then((res: ScpExecutionResults) => {
  console.log(`Process FirstCopy Command ${res.success ? 'success' : 'fail'}`);
  // console.log('Result: ', res);
});

// rs.sync('AnotherCopy')
//     .then((res: ScpExecutionResults) => {
//         console.log(`Process AnotherCopy Command ${res.success ? 'success' : 'fail'}`);
//         //  console.log('Result: ', res);
//     });
