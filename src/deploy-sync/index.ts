const fs = require('fs');

class Deployer {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }
}

enum DeployProtocol {
    ssh, other
}

class DeployServer {
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

}

class DeploySource {
    public id;
    public path;

    constructor(id: string, path: string) {
        this.id = id;
        this.path = path;
    }
}

class DeployUser {
    public username;

    constructor(username: string) {
        this.username = username;
    }
}

export class DeploySync {
    private static deployers: Map<string, Deployer> = new Map<string, Deployer>();
    private static servers: Map<string, DeployServer> = new Map<string, DeployServer>();
    private static users: Map<string, DeployUser> = new Map<string, DeployUser>();
    private static sources: Map<string, DeploySource> = new Map<string, DeploySource>();
    public static className = 'DeploySync';

    private constructor() {
        // Nop
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

