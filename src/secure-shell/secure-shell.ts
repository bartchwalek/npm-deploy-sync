import {CommandShell, ExecutionController} from '../command-shell';

export class SecureShell extends CommandShell {

    private remote: string = '';

    private remoteHost: string;
    private remotePort: number = 22;
    private remoteUser: string;
    private remotePass: string;

    private p;

    private dataToWriteOnConnect: string;

    constructor() {
        super('ssh', '-', {
                flags: {}
            }, (arg) => arg,
            '$flags $options $map[dest]',
            () => {
                this.setupRemote();
                ;
            },
            () => {
                this.connect();
            });
    }

    private setupRemote(): void {
        this.remote = `${this.remoteHost} -p ${this.remotePort}`;
        this.setMappedValue('dest', `${this.remoteUser ? this.remoteUser + '@' : ''}${this.remote}`);

    }

    public as(remoteUsr: string): SecureShell {
        this.remoteUser = remoteUsr;
        return this;
    }

    public disableHostChecking(): SecureShell {
        this.addOption('-oStrictHostKeyChecking=no');
        return this;
    }

    public password(remotePass: string): SecureShell {

        if (!this.remotePass) {
            this.argumentsPreprocessMap = '$special ' + this.argumentsPreprocessMap;
            this.command = 'sshpass';
        }

        this.remotePass = remotePass;
        this.addSpecial(['-p', `${this.remotePass}`, 'ssh']);
        return this;
    }

    public to(remoteHost: string): SecureShell {
        this.remoteHost = remoteHost;
        return this;
    }

    public port(remotePort: number): SecureShell {
        this.remotePort = remotePort;
        return this;
    }

    public async connect() {

        let dataToWrite: string;
        if (this.dataToWriteOnConnect) {
            dataToWrite = this.dataToWriteOnConnect + '\n';
        }

        return new Promise<ExecutionController>((resolve, reject) => {
            this.p =  this.spawn();
           this.p.onConnect(() => {
                resolve(this.p);
            }).write(dataToWrite).onData(data => {
                console.log(data);
            }).execute();
        });
    }

}
