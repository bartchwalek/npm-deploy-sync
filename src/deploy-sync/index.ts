import { ExecutionResults, Rsync } from '../rsync';
import { CommandShell } from '../command-shell';
import { DEBUGGER } from '../logger/logger';

const fs = require('fs');

console.log('[DEPLOYSYNC] npm-deploy-sync is dependant on some Linux libraries');
console.log('The default executor for deployments is Rsync, so please have rsync installed');
console.log('For automated authentication using passwords, have sshpass installed');
console.log('If you specify a .gpg file, gpg will be used in combination with sshpass for rsync');
console.log('SECURITY: preferably do not use cleartext passwords, but priv/pub keys or at least gpg');
console.log('--------------------------------------------------------------------------------------');

// @TODO: adapter for scp
// @TODO: adapter for sshfs
// @TODO: adapter for nc (netcat) + ssh

// @TODO: create a SSH wrapper for running commands on remote system easily (spawn + stdin)
// @TODO: add ports to server configs
// @TODO: add GPG signing for deployments?
// @TODO: investigate other security measures.

declare global {
  interface String {
    hash: () => number;
  }
}

// Utility function for a simple low collision hashing of strings
String.prototype.hash = function (): number {
  return this.length === 0
    ? 0
    : (() => {
        let hash: number = 0;
        for (let i = 0; i < this.length; i++) {
          const char: number = this.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return hash;
      })();
};

class Hashable {
  protected hashKeys: any[];
  protected hash: number;
  protected hashStr: string;
  public static defaultConfig: any = {
    checkUndefAndNull: false,
  };

  private config;

  constructor(hashablePropertyKeys: any[], config: any = Hashable.defaultConfig) {
    this.hashKeys = hashablePropertyKeys;
    this.config = config;
    this.generateHash();
  }

  private generateHashStr(): void {
    this.hashStr = '';
    let idx = 0;
    for (const key of this.hashKeys) {
      let v = eval(`this.${key}`);
      if (this.config.checkUndefAndNull ? v !== undefined && v !== null : true) {
        // Here we could check about the validity of v (not undefined, not null, or we can include those in the hash.
        if (v === undefined) {
          v = 'undefined';
        }
        if (v === null) {
          v = 'null';
        }
        if (v && !v.toString) {
          v = JSON.stringify(v);
        }
        this.hashStr += (idx === 0 ? '' : '-') + v;
        idx++;
      }
    }
  }

  protected generateHash(): void {
    this.generateHashStr();
    this.hash = this.hashStr.hash();
  }

  public getHash(): number {
    this.generateHash();
    return this.hash;
  }

  public getHashString(): string {
    this.generateHashStr();
    return this.hashStr;
  }

  public getHashKeysStr(): string {
    return this.hashKeys.join('-');
  }

  public getHashKeys(): any[] {
    return this.hashKeys;
  }
}

class Deployer {
  public classname: string = 'Deployer';
  public id: string;

  private source: DeploySource;
  private user: DeployUser;
  private options: DeployOptions;
  private server: DeployServer;
  private destination: DeployDestination;

  protected parent: Deployer;

  constructor(
    id: string,
    source?: DeploySource,
    user?: DeployUser,
    options?: DeployOptions,
    server?: DeployServer,
    destination?: DeployDestination,
    parent?: Deployer,
  ) {
    this.id = id;
    this.source = source;
    this.user = user;
    this.options = options;
    this.server = server;
    this.destination = destination;
    this.parent = parent;
  }

  public clone(newid): Deployer {
    return new Deployer(newid, this.source, this.user, this.options.clone(newid), this.server, this.destination, this);
  }

  public getSource(): DeploySource {
    return this.source;
  }

  public getUser(): DeployUser {
    return this.user;
  }

  public getOptions(): DeployOptions {
    return this.options;
  }

  public getServer(): DeployServer {
    return this.server;
  }

  public getDestination(): DeployDestination {
    return this.destination;
  }

  toString(): string {
    return this.id;
  }
}

enum DeployProtocol {
  ssh,
  other,
}

class DeployServer {
  public classname = 'DeployServer';
  private id: string;
  public host: string;
  public protocol: DeployProtocol;
  public port: number;

  constructor(id: string, host: string, protocol: DeployProtocol, port: number) {
    this.host = host;
    this.protocol = protocol;
    this.port = port;
    this.id = id;
  }

  toString(): string {
    return this.id;
  }
}

class DeploySource {
  public classname = 'DeploySource';
  public id;
  public path: string;
  public comment: string;

  constructor(id: string, path: string, comment?: string) {
    this.id = id;
    this.path = path;
    this.comment = comment;
  }

  clone(): DeploySource {
    return new DeploySource(this.id, this.path, this.comment);
  }

  toString(): string {
    return this.id;
  }
}

class DeployDestination {
  public classname = 'DeployDestination';
  public id;
  public path: string;
  public comment: string;

  constructor(id: string, path: string, comment?: string) {
    this.id = id;
    this.path = path;
    this.comment = comment;
  }

  toString(): string {
    return this.id;
  }
}

export interface DeploySyncConfig {
  archive?: boolean;
  update?: boolean;
  verbose?: boolean;
  exclude?: Array<string>;
}

class DeployOptions<T = Rsync> {
  public classname = 'DeployOptions';

  public id;

  protected config: DeploySyncConfig;

  protected parent: DeployOptions;

  constructor(id: string, config: DeploySyncConfig, parent?: DeployOptions) {
    this.id = id;
    this.config = config;
    this.parent = parent;
  }

  clone(newid): DeployOptions<T> {
    return new DeployOptions<T>(newid, this.config, this);
  }

  public configure(executor: CommandShell): void {
    DEBUGGER(this, `configuring executor ${executor}`);
    Object.entries(this.config as any)
      .filter(([k, v]) => (this.config as any).hasOwnProperty(k) && typeof executor[k] === 'function')
      .map(([k, v]) => {
        if (typeof this.config[k] === 'boolean') {
          if (executor[k].length > 0) {
            executor[k](this.config[k]);
          } else {
            if (this.config[k]) {
              executor[k]();
            }
          }
          return;
        }
        if (Array.isArray(this.config[k])) {
          (this.config[k] as Array<any>).map((v) => {
            executor[k](v);
          });
          return;
        }
      });
  }

  getGeneratorString(executor: any): string {
    let str = '';

    str =
      Object.entries(this.config as any)
        .filter(([k, v]) => (this.config as any).hasOwnProperty(k) && executor[k])
        .map(([k, v]) => {
          if (typeof this.config[k] === 'boolean') {
            return `${k}()`;
          }
          if (Array.isArray(this.config[k])) {
            return (this.config[k] as Array<any>).map((v) => `${k}('${v}')`).join('.');
          }
        })
        .join('.') || '';
    return str;
  }

  getConfig(): DeploySyncConfig {
    return this.config;
  }

  toString(): string {
    return this.id;
  }

  public getDescriptor(): string {
    return Object.entries(this.config)
      .map(([k, v]) => {
        if (typeof v === 'boolean' && v) {
          return k;
        } else {
          return '';
        }
      })
      .join(' ');
  }
}

enum AuthType {
  cleartext,
  gpg,
}

class DeployUser {
  public classname = 'DeployUser';
  public username;
  private auth: DeployAuth;
  public hasAuth: boolean = false;
  public authType: AuthType;
  public authFile: string;
  public pass;

  constructor(username: string, auth: DeployAuth) {
    this.username = username;
    this.auth = auth;
    console.log(auth);
    this.setAuth();
  }

  private setAuth() {
    if (this.auth) {
      if (this.auth.password) {
        // cleartext
        this.hasAuth = true;
        this.authType = AuthType.cleartext;
        this.pass = this.auth.password;
        return;
      }
      if (this.auth.file) {
        let sp = this.auth.file.split('.');
        let ftype = sp[sp.length - 1];

        switch (ftype) {
          case 'gpg':
            this.authType = AuthType.gpg;
            this.hasAuth = true;
            this.authFile = this.auth.file;
            return;
          default:
            break;
        }
      }
    }
  }

  toString(): string {
    return this.username;
  }

  clone(): DeployUser {
    return new DeployUser(this.username, this.auth);
  }
}

export class Deployment extends Hashable {
  public classname: string = 'Deployment';

  private deployer: Deployer;
  private deployUser: DeployUser;
  private deploySource: DeploySource;
  private deployServer: DeployServer;
  private deployOptions: DeployOptions;
  private deployDestination: DeployDestination;

  public id;

  private executorInstance: CommandShell;
  private executor: typeof CommandShell;

  private modified: boolean = false;

  private executed: boolean = false;
  private executionResults: ExecutionResults;

  constructor(id, deployer?: Deployer, attachedResults?: ExecutionResults) {
    super(['deployUser', 'deploySource', 'deployServer', 'deployOptions', 'deployDestination']);
    if (deployer) {
      this.using(deployer);
    }
    if (attachedResults) {
      this.executed = true;
      this.executionResults = attachedResults;
    }
    this.setId(id);
  }

  public getDeployer(): Deployer {
    return this.deployer;
  }

  public setId(id): Deployment {
    if (this.id === undefined) {
      this.id = id;
    }
    return this;
  }

  public getReport(id: string): string {
    let str = '';
    str += `------------------------------------------------------------------------------\n`;
    str += `Deployment :: ${id}\n`;
    str += `Source      : ${this.getDeployer().getSource()} : ${this.getDeployer().getSource().path}\n`;
    str += `User        : ${this.getDeployer().getUser()}\n`;
    str += `Server      : ${this.getDeployer().getServer()} : ${this.getDeployer().getServer().host}\n`;
    str += `Destination : ${this.getDeployer().getDestination()} : ${this.getDeployer().getDestination().path}\n`;
    str += `Options     : ${this.getDeployer().getOptions()} : ${this.getDeployer().getOptions().getDescriptor()}\n`;
    if (this.getResults()) {
      let r = this.getResults();
      str += `Succeeded  : ${r.success}\n`;
      str += `Started    : ${new Date(r.startTime).toISOString()}\n`;
      str += `Ended      : ${new Date(r.endTime).toISOString()}\n`;
      if (r.hasError) {
        str += `Error:      : ${r.description}\n`;
      }
    }
    str += `------------------------------------------------------------------------------\n`;
    return str;
  }

  public getDescriptor(): string {
    return `${this.deployUser}-${this.deploySource}-${this.deployServer}-${this.deployOptions}-${this.deployDestination}`;
  }

  public toString(): string {
    return `[${this.classname}:${this.getDescriptor()}]`;
  }

  public using(
    deployer: Deployer | DeployUser | DeploySource | DeployServer | DeployOptions | DeployDestination | string,
  ): Deployment {
    if (typeof deployer === 'string' && deployer.indexOf(':') > 1) {
      let [classname, id] = deployer.split(':');
      classname = classname[0].toUpperCase() + classname.toLowerCase().substring(1);
      deployer = DeploySync[`get${classname}`] && DeploySync[`get${classname}`](id);
    }

    deployer = deployer as Deployer | DeployUser | DeploySource | DeployServer | DeployOptions | DeployDestination;

    if (deployer && deployer.classname) {
      switch (deployer.classname) {
        case 'Deployer':
          this.deployer = deployer as Deployer;
          this.deployOptions = this.deployer.getOptions();
          this.deploySource = this.deployer.getSource();
          this.deployUser = this.deployer.getUser();
          this.deployServer = this.deployer.getServer();
          this.deployDestination = this.deployer.getDestination();
          // using an existing deployer reinits to the deployer config, hence we don't create a new deployer...
          this.modified = true;
          break;
        case 'DeployUser':
          deployer = deployer as DeployUser;
          if (this.deployUser.toString() !== deployer.toString()) {
            this.modified = true;
          }

          this.deployUser = deployer;

          break;
        case 'DeployServer':
          deployer = deployer as DeployServer;
          if (this.deployServer.toString() !== deployer.toString()) {
            this.modified = true;
          }
          this.deployServer = deployer;

          break;
        case 'DeploySource':
          deployer = deployer as DeploySource;
          if (this.deploySource.toString() !== deployer.toString()) {
            this.modified = true;
          }
          this.deploySource = deployer as DeploySource;
          break;
        case 'DeployOptions':
          deployer = deployer as DeployOptions;
          if (this.deployOptions.toString() !== deployer.toString()) {
            this.modified = true;
          }
          this.deployOptions = deployer as DeployOptions;
          break;

        case 'DeployDestination':
          deployer = deployer as DeployDestination;
          if (this.deployDestination.toString() !== deployer.toString()) {
            this.modified = true;
          }
          this.deployDestination = deployer as DeployDestination;
          break;
      }
    }

    return this;
  }

  // public save(newid: string = this.getDescriptor()): Deployment {
  //     return this;
  // }

  public getResults(): ExecutionResults {
    return this.executionResults;
  }

  public save(newid: string = this.getDescriptor(), attachedResults: ExecutionResults = null): Deployment {
    newid += '-' + Math.floor(Math.random() * 10000000);
    DEBUGGER(this, `Adding new deployment with id: ${newid}`);
    const deployer = new Deployer(
      this.getDescriptor(),
      this.deploySource,
      this.deployUser,
      this.deployOptions,
      this.deployServer,
      this.deployDestination,
    );
    return DeploySync.newDeployment(newid, deployer, true, attachedResults);
  }

  public with(executor: CommandShell): Deployment {
    this.executorInstance = executor;
    return this;
  }

  public async execute(executor: CommandShell = this.executorInstance): Promise<Deployment> {
    let useSSHPASS: boolean = false;
    let useGPG: boolean = false;
    let start = new Date().getTime();
    if (this.deployUser.hasAuth) {
      switch (this.deployUser.authType) {
        case AuthType.cleartext:
          useSSHPASS = true;
          break;

        case AuthType.gpg:
          useGPG = true;
          break;
      }
    }

    if (!executor) {
      executor = new Rsync({ useSshPass: useSSHPASS, useGPG });
    }

    this.deployOptions.configure(executor);

    if (executor instanceof Rsync) {
      DEBUGGER(this, 'Configuring Rsync');
      (executor as Rsync).from(this.deploySource.path)
          .into(this.deployDestination.path)
          .as(this.deployUser.username)
          .to(this.deployServer.host);
      if (useSSHPASS) {
        (executor as Rsync).setClearTextPassword(this.deployUser.pass);
      }
      if (useGPG) {
        (executor as Rsync).setGPG(this.deployUser.authFile);
      }
    }

    let results: ExecutionResults = await executor.execute();
    DEBUGGER(this, 'Execution completed');
    let end = new Date().getTime();

    results.startTime = start;
    results.endTime = end;

    // if (this.modified) {
    // this is a new config of deployment.
    return this.save(undefined, results);
    // }

    // return this;
  }
}

export interface DeployAuth {
  file?: string;
  password?: string;
}

export class DeploySync {
  private static deployers: Map<string, Deployer> = new Map<string, Deployer>();
  private static deployments: Map<string, Deployment> = new Map<string, Deployment>();
  private static servers: Map<string, DeployServer> = new Map<string, DeployServer>();
  private static users: Map<string, DeployUser> = new Map<string, DeployUser>();
  private static options: Map<string, DeployOptions> = new Map<string, DeployOptions>();
  private static sources: Map<string, DeploySource> = new Map<string, DeploySource>();
  private static destinations: Map<string, DeployDestination> = new Map<string, DeployDestination>();

  public static classname = 'DeploySync';

  public static getHash = () => 'ROOT';

  public static defaultExecutor = Rsync;

  private constructor() {
    // Nop
  }

  public static deploymentsCount(): number {
    return DeploySync.deployments.size;
  }

  public static listDeployments(): string {
    let str = '';
    DeploySync.deployments.forEach((deployment, id) => {
      str += deployment.getReport(id);
    });
    return str;
  }

  public static saveReport(filepath: string, specificDeployment?) {
    if (specificDeployment && DeploySync.deployments.has(specificDeployment)) {
      fs.writeFileSync(filepath, DeploySync.deployments.get(specificDeployment).getReport(specificDeployment), {
        encoding: 'utf-8',
        flag: 'w',
      });
    }

    if (specificDeployment === undefined) {
      fs.writeFileSync(filepath, DeploySync.listDeployments(), { encoding: 'utf-8', flag: 'w' });
    }
  }

  public static newDeployer(name: string | object): Deployer {
    let deployer: Deployer;
    if (typeof name === 'string') {
      if (!DeploySync.deployers.has(name)) {
        deployer = new Deployer(name);
        DeploySync.deployers.set(name, deployer);
      }
    } else {
      let config = name as any;
      DEBUGGER(this, 'Adding new deployer: ', config.id);
      deployer = new Deployer(
        config.id,
        DeploySync.getSource(config.source),
        DeploySync.getUser(config.user),
        DeploySync.getOptions(config.options),
        DeploySync.getServer(config.server),
        DeploySync.getDestination(config.dest),
      );
      DeploySync.deployers.set(config.id, deployer);
    }

    return deployer;
  }

  public static getDeployer(name: string): Deployer {
    return DeploySync.deployers.get(name);
  }

  public static newDeployment(
    id: string,
    fromDeployerOrConfig?: Deployer | string,
    overwrite: boolean = false,
    attachedResults?: ExecutionResults,
  ): Deployment {
    let deployment: Deployment;
    if (!DeploySync.deployments.has(id)) {
      if (fromDeployerOrConfig) {
        if (fromDeployerOrConfig instanceof Deployer) {
          deployment = new Deployment(id, (fromDeployerOrConfig as Deployer).clone(id), attachedResults);
        } else {
          if (typeof fromDeployerOrConfig === 'string') {
            deployment = new Deployment(id, DeploySync.deployers.get(fromDeployerOrConfig).clone(id), attachedResults);
          }
        }
      }
      DeploySync.deployments.set(id, deployment);
    } else {
      // if (overwrite) {
      //     DeploySync.deployments.delete(id);
      //     return DeploySync.newDeployment(id, fromDeployerOrConfig, overwrite);
      // }
      // deployment = DeploySync.deployments.get(id);
      // This deployment already exists, hence we will make a copy.
    }
    return deployment;
  }

  public static getDeployment(id: string): Deployment {
    return DeploySync.deployments.get(id);
  }

  public static newServer(
    name: string,
    host: string,
    protocol: DeployProtocol = DeployProtocol.ssh,
    port: number = 22,
  ): DeployServer {
    let deployServer: DeployServer;
    if (!DeploySync.servers.has(name)) {
      deployServer = new DeployServer(name, host, protocol, port);
      DeploySync.servers.set(name, deployServer);
    }

    return deployServer;
  }

  public static getServer(name: string): DeployServer {
    return DeploySync.servers.get(name);
  }

  public static newUser(username: string, authentication: DeployAuth): DeployUser {
    let deployUser: DeployUser;
    if (!DeploySync.users.has(username)) {
      deployUser = new DeployUser(username, authentication);
      DeploySync.users.set(username, deployUser);
    }

    return deployUser;
  }

  public static getUser(name: string): DeployUser {
    return DeploySync.users.get(name);
  }

  public static newOptions(id: string, config: any): DeployOptions {
    let deployOptions: DeployOptions;
    if (!DeploySync.options.has(id)) {
      DEBUGGER(this, 'Adding new options ', id);
      deployOptions = new DeployOptions(id, config);
      DeploySync.options.set(id, deployOptions);
    }

    return deployOptions;
  }

  public static getOptions(id: string): DeployOptions {
    return DeploySync.options.get(id);
  }

  public static newSource(id: string, path: string, comment?: string): DeploySource {
    let deploySource: DeploySource;
    if (!DeploySync.sources.has(id)) {
      deploySource = new DeploySource(id, path, comment);
      DeploySync.sources.set(id, deploySource);
    }

    return deploySource;
  }

  public static getSource(id: string): DeploySource {
    return DeploySync.sources.get(id);
  }

  public static newDestination(id: string, path: string, comment?: string): DeployDestination {
    let deployDestination: DeployDestination;
    if (!DeploySync.destinations.has(id)) {
      deployDestination = new DeployDestination(id, path, comment);
      DeploySync.destinations.set(id, deployDestination);
    }

    return deployDestination;
  }

  public static getDestination(id: string): DeployDestination {
    return DeploySync.destinations.get(id);
  }

  public static loadServersConfig(config: Array<any>): void {
    config.forEach((v) => DeploySync.newServer(v.id, v.host, v.protocol, v.port));
  }

  public static loadServersConfigFromFile(path: string): void {
    let options = { encoding: 'utf-8', flag: 'r' };
    let buff = fs.readFileSync(path, options);
    DeploySync.loadServersConfig(JSON.parse(buff));
  }

  public static loadDeploymentsConfig(config: Array<any>): void {
    config.forEach((v) => DeploySync.newDeployer(v));
  }

  public static loadDeploymentsConfigFromFile(path: string): void {
    let options = { encoding: 'utf-8', flag: 'r' };
    let buff = fs.readFileSync(path, options);
    DeploySync.loadDeploymentsConfig(JSON.parse(buff));
  }

  public static loadUsersConfig(config: Array<any>): void {
    config.forEach((v) => DeploySync.newUser(v.username, v.authentication));
  }

  public static loadUsersConfigFromFile(path: string): void {
    let options = { encoding: 'utf-8', flag: 'r' };
    let buff = fs.readFileSync(path, options);
    DeploySync.loadUsersConfig(JSON.parse(buff));
  }

  public static loadOptionsConfig(config: Array<any>): void {
    config.forEach((v) => DeploySync.newOptions(v.id, v.config));
  }

  public static loadOptionsConfigFromFile(path: string): void {
    let options = { encoding: 'utf-8', flag: 'r' };
    let buff = fs.readFileSync(path, options);
    DeploySync.loadOptionsConfig(JSON.parse(buff));
  }

  public static loadSourcesConfig(config: Array<any>): void {
    config.forEach((v) => DeploySync.newSource(v.id, v.path, v.comment));
  }

  public static loadSourcesConfigFromFile(path: string): void {
    let options = { encoding: 'utf-8', flag: 'r' };
    let buff = fs.readFileSync(path, options);
    DeploySync.loadSourcesConfig(JSON.parse(buff));
  }

  public static loadDestinationsConfig(config: Array<any>): void {
    config.forEach((v) => DeploySync.newDestination(v.id, v.path, v.comment));
  }

  public static loadDestinationsConfigFromFile(path: string): void {
    let options = { encoding: 'utf-8', flag: 'r' };
    let buff = fs.readFileSync(path, options);
    DeploySync.loadDestinationsConfig(JSON.parse(buff));
  }

  public static loadConfig(config: any): void {
    for (const c of Object.keys(config)) {
      if (config.hasOwnProperty(c)) {
        DEBUGGER(this, `Loading config for ${c}`);
        switch (c) {
          case 'servers':
            DeploySync.loadServersConfig(config[c]);
            break;

          case 'users':
            DeploySync.loadUsersConfig(config[c]);
            break;

          case 'deployments':
            DeploySync.loadDeploymentsConfig(config[c]);
            break;

          case 'sources':
            DeploySync.loadSourcesConfig(config[c]);
            break;

          case 'destinations':
            DeploySync.loadDestinationsConfig(config[c]);
            break;

          case 'options':
            DeploySync.loadOptionsConfig(config[c]);
            break;
        }
      }
    }
  }

  public static loadConfigFromFile(path: string): void {
    let options = { encoding: 'utf-8', flag: 'r' };
    let buff = fs.readFileSync(path, options);
    DeploySync.loadConfig(JSON.parse(buff));
  }
}
