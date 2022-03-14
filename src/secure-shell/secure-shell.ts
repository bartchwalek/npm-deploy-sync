import {CommandShell, ExecutionController, RewritableCommandArgs} from '../command-shell';

export class SecureShell extends CommandShell {
    protected remote: string = '';

    protected remoteHost: string;
    protected remotePort: number = 22;
    protected remoteUser: string;
    protected remotePass: string;

    protected p;

    protected dataToWriteOnConnect: string;

    constructor(debugLevel: number = 5, rewrite: RewritableCommandArgs = {} as any) {
        super(
            'ssh',
            '-',
            {
                flags: {},
            },
            (arg) => arg,
            '$flags $options $map[dest]',
            () => {
                this.setupRemote();
            },
            () => {
                return this.connect();
            },
            debugLevel,
            rewrite
        );
    }

    protected setupRemote(): void {
        this.remote = `${this.remoteHost} -p ${this.remotePort}`;
        this.setMappedValue('dest', `${this.remoteUser ? this.remoteUser + '@' : ''}${this.remote}`);
    }

    public quiet(): this {
        this.addFlag('q');
        return this;
    }

    public verbose(): this {
        this.addFlag('v');
        return this;
    }

    public as(remoteUsr: string): this {
        this.remoteUser = remoteUsr;
        return this;
    }

    public disableHostChecking(): this {
        this.addOption('-oStrictHostKeyChecking=no');
        return this;
    }

    public password(remotePass: string): this {
        if (!this.remotePass) {
            this.argumentsPreprocessMap = '$special ' + this.argumentsPreprocessMap;
            this.command = 'sshpass';
        }

        this.remotePass = remotePass;
        this.addSpecial(['-p', `${this.remotePass}`, this.originalCommand]);
        return this;
    }

    public to(remoteHost: string): this {
        this.remoteHost = remoteHost;
        return this;
    }

    public port(remotePort: number): this {
        this.remotePort = remotePort;
        return this;
    }

    public async connect(): Promise<ExecutionController> {
        let dataToWrite: string;
        if (this.dataToWriteOnConnect) {
            dataToWrite = this.dataToWriteOnConnect + '\n';
        }

        return new Promise<ExecutionController>((resolve, reject) => {
            this.p = this.spawn();
            this.p
                .onConnect(() => {
                    resolve(this.p);
                })
                .write(dataToWrite)
                .onData((data) => {
                    this.isDebug() && console.log(data);
                })
                .execute();
        });
    }
}
