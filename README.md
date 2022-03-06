## Deploy - sync for Node using rsync.

The library will allow deploying compiled code on a remote server using credentials and rsync and its options.

* Any version prior to 1.0.6 is not functionnal, not recommended, not supported; but the wrapper for Rsync is
  functionnal.

---

#### ChangeLog:

Version 1.0.7: Fixed Rsync wrapper and created DeploySync with config loading, deployment and reporting.

---

### USAGE

Here is an example of a simple deployment 
```ts
DeploySync.loadConfigFromFile('deploy.conf.json');

const myDeployment = DeploySync.newDeployment('local-testing', 'localtest');
myDeployment.execute().then((deployment: Deployment) => {
    let res = deployment.getResults();
    console.log(res);
    DeploySync.listDeployments();
});
```

1. We load the config from a file. (here deploy.conf.json located in the current working directory)
2. We create a new deployment... First argument is the name we want to give it, second argument is the deployment model from the config. (The abstract deployment (deployer) on which it will be based) [A concrete deployment is an instance in time of the abstract deployment specified by the config, a concrete deployment is immutable, always new and can be modified before execution, it will always result in a new deployment with results]
3. Then we execute the deployment and wait for the results.
4. Once we get the results, we log them.
5. We also here list all the deployments till now in this session.

Here is the configuration file used (deploy.conf.json)
```json
{
  "users": [
    {
      "username": "my_username",
      "comment": "Local user",
      "type": "normal",
      "group": "my_group"
    }
  ],
  "sources": [
    {
      "id": "localdata",
      "comment": "local test data",
      "path": "/home/bchwalek/testdata/"
    }
  ],
  "destinations": [
    {
      "id": "tmp",
      "comment": "Temporary",
      "path": "/home/my_username/tmp/"
    }
  ],
  "options": [
    {
      "id": "update",
      "config": {
        "exclude": ["assets/stub/**"],
        "verbose": true,
        "update": true,
        "archive": true
      }
    },
    {
      "id": "create",
      "config": {
        "exclude": ["assets/stub/**"],
        "verbose": true,
        "archive": true
      }
    }
  ],
  "servers": [
    {
      "id": "local",
      "comment": "localhost loop",
      "location": "here",
      "responsible": "",
      "host": "127.0.0.1"
    }
  ],
  "deployments": [
    {
      "id": "localtest",
      "comment": "A local loop test",
      "server": "local",
      "source": "localdata",
      "dest": "tmp",
      "options": "update",
      "user": "my_username"
    }
  ]
}

```
1. A full configuration is a json, is a set of arrays with the following keys:
   1. users : a list of different users we can use.
   2. sources : a list of sources (paths from, on the local server)
   3. destinations : a list of destinations (paths to, on the remote server)
   4. options : the options provided to the executor (Rsync here)
   5. servers : a list of remote servers/hosts to which we will sync
   6. deployments : a list of compatible configurations or combinations of these 5 variables we wish to base our deployments on, these are abstract deployments which will become concrete as we use them (reconfigure, deploy in time and get results)
2. The configuration can be split in different files.
3. The configuration can be create dynamically without using files.
4. The configuration file must be json and respect he structure in order to be loaded properly.
5. For now, Rsync is not fully implemented, so not all options are available, please feel free to fork and contribute.
6. Other executors can be implemented (scp?)

---


