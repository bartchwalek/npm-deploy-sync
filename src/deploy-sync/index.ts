import { ExecutionResults, Rsync } from '../rsync';
import { CommandShell } from '../command-shell';

const fs = require('fs');

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

  constructor(
    id: string,
    source?: DeploySource,
    user?: DeployUser,
    options?: DeployOptions,
    server?: DeployServer,
    destination?: DeployDestination,
  ) {
    this.id = id;
    this.source = source;
    this.user = user;
    this.options = options;
    this.server = server;
    this.destination = destination;
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

  constructor(id: string, config: DeploySyncConfig) {
    this.id = id;
    this.config = config;
  }

  public configure(executor: CommandShell): void {
    console.log(`[DeploySync] :: configuring executor ${executor}`);
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

class DeployUser {
  public classname = 'DeployUser';
  public username;

  constructor(username: string) {
    this.username = username;
  }

  toString(): string {
    return this.username;
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

  private executorInstance: CommandShell;
  private executor: typeof CommandShell;

  private modified: boolean = false;

  private executed: boolean = false;
  private executionResults: ExecutionResults;

  constructor(deployer?: Deployer, attachedResults?: ExecutionResults) {
    super(['deployUser', 'deploySource', 'deployServer', 'deployOptions', 'deployDestination']);
    if (deployer) {
      this.using(deployer);
    }
    if (attachedResults) {
      this.executed = true;
      this.executionResults = attachedResults;
    }
  }

  public getDeployer(): Deployer {
    return this.deployer;
  }

  public getDescriptor(): string {
    return `${this.deployUser}-${this.deploySource}-${this.deployServer}-${this.deployOptions}-${this.deployDestination}`;
  }

  public toString(): string {
    return `[${this.classname}:${this.getDescriptor()}]`;
  }

  public using(deployer: Deployer | DeployUser | DeploySource | DeployServer | DeployOptions | string): Deployment {
    if (typeof deployer === 'string' && deployer.indexOf(':') > 1) {
      let [classname, id] = deployer.split(':');
      classname = classname[0].toUpperCase() + classname.toLowerCase().substring(1);
      deployer = DeploySync[`get${classname}`] && DeploySync[`get${classname}`](id);
    }

    deployer = deployer as Deployer | DeployUser | DeploySource | DeployServer | DeployOptions;

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
    console.log(`[DeploySync] :: Adding new deployment with id: ${newid}`);
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
    let start = new Date().getTime();
    if (!executor) {
      executor = new Rsync({});
    }
    console.log('Configuring executor ', executor);
    this.deployOptions.configure(executor);

    if (executor instanceof Rsync) {
      console.log('Configuring Rsync');
      (executor as Rsync).from(this.deploySource.path);
      (executor as Rsync).to(this.deployDestination.path);
      (executor as Rsync).asRemoteUser(this.deployUser.username);
      (executor as Rsync).remote(this.deployServer.host);
    }

    let results: ExecutionResults = await executor.execute();
    console.log('Execution completed');
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

export class DeploySync {
  private static deployers: Map<string, Deployer> = new Map<string, Deployer>();
  private static deployments: Map<string, Deployment> = new Map<string, Deployment>();
  private static servers: Map<string, DeployServer> = new Map<string, DeployServer>();
  private static users: Map<string, DeployUser> = new Map<string, DeployUser>();
  private static options: Map<string, DeployOptions> = new Map<string, DeployOptions>();
  private static sources: Map<string, DeploySource> = new Map<string, DeploySource>();
  private static destinations: Map<string, DeployDestination> = new Map<string, DeployDestination>();

  public static className = 'DeploySync';

  public static defaultExecutor = Rsync;

  private constructor() {
    // Nop
  }

  public static deploymentsCount(): number {
    return DeploySync.deployments.size;
  }

  public static listDeployments(): void {
    DeploySync.deployments.forEach((deployment, id) => {
      console.log(`------------------------------------------------------------------------------`);
      console.log(`Deployment :: ${id}`);
      console.log(
        `Source      : ${deployment.getDeployer().getSource()} : ${deployment.getDeployer().getSource().path}`,
      );
      console.log(`User        : ${deployment.getDeployer().getUser()}`);
      console.log(
        `Server      : ${deployment.getDeployer().getServer()} : ${deployment.getDeployer().getServer().host}`,
      );
      console.log(
        `Destination : ${deployment.getDeployer().getDestination()} : ${
          deployment.getDeployer().getDestination().path
        }`,
      );
      console.log(
        `Options     : ${deployment.getDeployer().getOptions()} : ${deployment
          .getDeployer()
          .getOptions()
          .getDescriptor()}`,
      );
      if (deployment.getResults()) {
        let r = deployment.getResults();
        console.log(`Succeeded  : ${r.success}`);
        console.log(`Started    : ${new Date(r.startTime).toISOString()}`);
        console.log(`Ended      : ${new Date(r.endTime).toISOString()}`);
        if (r.hasError) {
          console.log(`Error:      : ${r.description}`);
        }
      }
      console.log(`------------------------------------------------------------------------------`);
    });
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
      console.log('Adding new deployer: ', config.id);
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
          deployment = new Deployment(fromDeployerOrConfig as Deployer, attachedResults);
        } else {
          if (typeof fromDeployerOrConfig === 'string') {
            deployment = new Deployment(DeploySync.deployers.get(fromDeployerOrConfig), attachedResults);
          }
        }
      }
      DeploySync.deployments.set(id, deployment);
    } else {
      if (overwrite) {
        DeploySync.deployments.delete(id);
        return DeploySync.newDeployment(id, fromDeployerOrConfig, overwrite);
      }
      deployment = DeploySync.deployments.get(id);
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

  public static newUser(username: string): DeployUser {
    let deployUser: DeployUser;
    if (!DeploySync.users.has(username)) {
      deployUser = new DeployUser(username);
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
      console.log('Adding new options ', id);
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
    config.forEach((v) => DeploySync.newUser(v.username));
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
        console.log(`[DeploySync] :: Loading config for ${c}`);
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
