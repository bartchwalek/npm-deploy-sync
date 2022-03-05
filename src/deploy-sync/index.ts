const fs = require('fs');

class Deployer {
    public classname: string = 'Deployer';
    public id: string;

    private source: DeploySource;
    private user: DeployUser;
    private options: DeployOptions;
    private server: DeployServer;


    constructor(id: string, source?: DeploySource, user?: DeployUser, options?: DeployOptions, server?: DeployServer) {
        this.id = id;
        this.source = source;
        this.user = user;
        this.options = options;
        this.server = server;
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

    toString(): string {
        return this.id;
    }
}

enum DeployProtocol {
    ssh, other
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
    public path;

    constructor(id: string, path: string) {
        this.id = id;
        this.path = path;
    }

    toString(): string {
        return this.id;
    }
}

class DeployOptions {
    public classname = 'DeployOptions';

    public id;

    constructor(id: string) {
        this.id = id;
    }

    toString(): string {
        return this.id;
    }

    public getDescriptor(): string {
        return ``;
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

class Deployment {

    public classname: string = 'Deployment';

    private deployer: Deployer;
    private deployUser: DeployUser;
    private deploySource: DeploySource;
    private deployServer: DeployServer;
    private deployOptions: DeployOptions;

    private modified: boolean = false;

    constructor(deployer?: Deployer) {
        if (deployer) {
            this.using(deployer);
        }
    }

    public getDeployer(): Deployer {
        return this.deployer;
    }

    public getDescriptor(): string {
        return `${this.deployUser}-${this.deploySource}-${this.deployServer}-${this.deployOptions}`;
    }

    public toString(): string {
        return `[${this.classname}:${this.getDescriptor()}]`;
    }

    public using(deployer: Deployer | DeployUser | DeploySource | DeployServer | DeployOptions): Deployment {

        if (deployer.classname) {
            switch (deployer.classname) {
                case 'Deployer':
                    this.deployer = deployer as Deployer;
                    this.deployOptions = this.deployer.getOptions();
                    this.deploySource = this.deployer.getSource();
                    this.deployUser = this.deployer.getUser();
                    this.deployServer = this.deployer.getServer();
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
                    this.deployOptions = deployer;
                    break;
            }
        }

        return this;
    }

    // public save(newid: string = this.getDescriptor()): Deployment {
    //     return this;
    // }

    public save(newid: string = this.getDescriptor()): Deployment {
        const deployer = new Deployer(this.getDescriptor(), this.deploySource, this.deployUser, this.deployOptions, this.deployServer);
        return DeploySync.newDeployment(newid, deployer, true);
    }

    public execute(): Deployment {


        if (this.modified) {
            // this is a new config of deployment.
            return this.save();
        }

        return this;

    }

}

export class DeploySync {
    private static deployers: Map<string, Deployer> = new Map<string, Deployer>();
    private static deployments: Map<string, Deployment> = new Map<string, Deployment>();
    private static servers: Map<string, DeployServer> = new Map<string, DeployServer>();
    private static users: Map<string, DeployUser> = new Map<string, DeployUser>();
    private static sources: Map<string, DeploySource> = new Map<string, DeploySource>();


    public static className = 'DeploySync';

    private constructor() {
        // Nop
    }

    public static listDeployments(): void {
        DeploySync.deployments.forEach((deployment) => {
            console.log(`------------------------------------------------------------------------------`);
            console.log(`Deployment :: ${deployment.toString()}`);
            console.log(`Source      : ${deployment.getDeployer().getSource()} : ${deployment.getDeployer().getSource().path}`);
            console.log(`User        : ${deployment.getDeployer().getUser()}`);
            console.log(`Server      : ${deployment.getDeployer().getServer()} : ${deployment.getDeployer().getServer().host}`);
            console.log(`Destination : ${deployment.getDeployer().getServer()} : ${deployment.getDeployer().getServer().host}`);
            console.log(`Options     : ${deployment.getDeployer().getOptions()} : ${deployment.getDeployer().getOptions().getDescriptor()}`);
            console.log(`------------------------------------------------------------------------------`);

        });
    }

    public static newDeployer(name: string): Deployer {
        let deployer: Deployer;
        if (!DeploySync.deployers.has(name)) {
            deployer = new Deployer(name);
            DeploySync.deployers.set(name, deployer);
        }
        return deployer;
    }

    public static getDeployer(name: string): Deployer {
        return DeploySync.deployers.get(name);
    }

    public static newDeployment(id: string, fromDeployerOrConfig?: Deployer | string, overwrite: boolean = false): Deployment {
        let deployment: Deployment;
        if (!DeploySync.deployments.has(id)) {
            if (fromDeployerOrConfig) {
                if (fromDeployerOrConfig instanceof Deployer) {
                    deployment = new Deployment(fromDeployerOrConfig as Deployer);
                } else {
                    if (typeof fromDeployerOrConfig === 'string') {
                        deployment = new Deployment(DeploySync.deployers.get(fromDeployerOrConfig));
                    }
                }
            }
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

    public static newServer(name: string, host: string, protocol: DeployProtocol = DeployProtocol.ssh, port: number = 22): DeployServer {
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

    public static newSource(id: string, path: string): DeploySource {
        let deploySource: DeploySource;
        if (!DeploySync.sources.has(id)) {
            deploySource = new DeploySource(id, path);
            DeploySync.sources.set(id, deploySource);
        }

        return deploySource;
    }


    public static getSource(id: string): DeploySource {
        return DeploySync.sources.get(id);
    }

    public static loadServersConfig(config: Array<any>): void {
        config.forEach(v => DeploySync.newServer(v.id, v.host, v.protocol, v.port));
    }

    public static loadServersConfigFromFile(path: string): void {
        let options = {encoding: 'utf-8', flag: 'r'};
        let buff = fs.readFileSync(path, options);
        DeploySync.loadServersConfig(JSON.parse(buff));
    }

    public static loadDeploymentsConfig(config: Array<any>): void {
        config.forEach(v => DeploySync.newDeployer(v.name));
    }

    public static loadDeploymentsConfigFromFile(path: string): void {
        let options = {encoding: 'utf-8', flag: 'r'};
        let buff = fs.readFileSync(path, options);
        DeploySync.loadDeploymentsConfig(JSON.parse(buff));
    }

    public static loadUsersConfig(config: Array<any>): void {
        config.forEach(v => DeploySync.newUser(v.username));
    }

    public static loadUsersConfigFromFile(path: string): void {
        let options = {encoding: 'utf-8', flag: 'r'};
        let buff = fs.readFileSync(path, options);
        DeploySync.loadUsersConfig(JSON.parse(buff));
    }

    public static loadSourcesConfig(config: Array<any>): void {
        config.forEach(v => DeploySync.newSource(v.id, v.path));
    }

    public static loadSourcesConfigFromFile(path: string): void {
        let options = {encoding: 'utf-8', flag: 'r'};
        let buff = fs.readFileSync(path, options);
        DeploySync.loadSourcesConfig(JSON.parse(buff));
    }

    public static loadConfig(config: any): void {
        for (const c in config.keys()) {
            if (config.hasOwnProperty(c)) {
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
                }
            }
        }
    }

    public static loadConfigFromFile(path: string): void {
        let options = {encoding: 'utf-8', flag: 'r'};
        let buff = fs.readFileSync(path, options);
        DeploySync.loadConfig(JSON.parse(buff));
    }

}

