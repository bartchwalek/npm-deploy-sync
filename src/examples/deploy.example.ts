/***
 * Some primitive examples here.
 */
import { Deployment, DeploySync } from '../deploy-sync';

DeploySync.loadConfigFromFile('deploy.conf.json');

const myDeployment = DeploySync.newDeployment('local-testing', 'localtest');
myDeployment.execute().then((deployment: Deployment) => {
  let res = deployment.getResults();
  // console.log(res);
  DeploySync.saveReport(`output.report${deployment.getHash()}.txt`, deployment.id);
});

const secondDeployment = DeploySync.newDeployment('local-test-2', 'localtest');

secondDeployment
  .using('source:localdata2')
  .execute()
  .then((deployment: Deployment) => {
    let res = deployment.getResults();
    // console.log(res);
    DeploySync.saveReport(`output.reports.txt`);
  });

// const newDeployment = myDeployment.using('destination:atp3').using('user:row44').execute();
// const anotherDeployment = DeploySync.getDeployment('d1');
