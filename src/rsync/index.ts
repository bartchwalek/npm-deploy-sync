import {CommandShell} from '../command-shell';
import {ErrorCodesDescriptors, LinuxExitCode} from '../error-codes/error-codes';

export interface RsyncConfig {
}

export interface RsyncResults extends ExecutionResults {
}

export interface ExecutionData {
    error: any;
    data: any;
}


export interface ExecutionResults {
    data: ExecutionData;
    exitCode: LinuxExitCode;
    error: any;
    hasError: boolean;
    success: boolean;
    description: string;
    startTime?: number;
    endTime?: number;
}

export class Rsync extends CommandShell {
    private source: string;
    private destination: string;
    private user: string;
    private remoteHost: string;
    private remotePath: string;

    private logOut: boolean = false;

    constructor(configuration: RsyncConfig) {
        super(
            'rsync',
            '-',
            {
                flags: {
                    u: 'skip files that are newer on the receiver',
                    v: 'increase verbosity',
                    a: 'This is equivalent to -rlptgoD. It is a quick way of saying you want recursion and want to preserve almost everything',
                    r: 'This tells rsync to copy directories recursively',
                    t: 'times, transfer modification times along with the files and update them on the remote system',
                    n: 'rsync perform a trial run that doesn\'t make any changes ',
                    h: 'Output numbers in a more human-readable format',
                },
            },
            (arg: string) => {
                return arg;
            },
            '$flags $options $map[local] $map[dest]',
            () => {
                this.setupDestination();
            },
            (...args) => {
                return this.sync();
            }
        );
    }

    public setupDestination(): void {
        this.destination = `${this.remoteHost}:${this.remotePath ? this.remotePath : '/'}`;
        this.setMappedValue('dest', `${this.user ? this.user + '@' : ''}${this.destination}`);
    }

    public asRemoteUser(username: string): Rsync {
        this.user = username;
        return this;
    }

    public include(): Rsync {
        return this;
    }

    public update(): Rsync {
        this.addFlag('u');
        return this;
    }

    public verbose(): Rsync {
        this.addFlag('v');
        return this;
    }

    // a is same as rlptgoD
    public archive(): Rsync {
        this.addFlag('a');
        return this;
    }

    public recurse(): Rsync {
        this.addFlag('r');
        return this;
    }

    public copyLinks(): Rsync {
        this.addFlag('l');
        return this;
    }

    public transferTimes(): Rsync {
        this.addFlag('t');
        return this;
    }

    public dry(): Rsync {
        this.addFlag('n');
        return this;
    }

    public human(): Rsync {
        this.addFlag('h');
        return this;
    }

    public overwrite(): Rsync {
        return this;
    }

    public logOutput(yesNo: boolean = true) {
        this.logOut = yesNo;
    }

    public async sync(): Promise<RsyncResults> {
        let localErrorData = [];
        let localData = [];
        let localError;
        return new Promise<RsyncResults>((resolve, reject) => {
            this.spawn()
                .onClose((reason) => {
                    this.logOut && console.log(reason);
                    resolve({
                        hasError: !!localError,
                        error: localError,
                        exitCode: reason,
                        description: ErrorCodesDescriptors[reason],
                        success: (reason === LinuxExitCode.SUCCESS),
                        data: {
                            data: localData,
                            error: localErrorData
                        }
                    } as RsyncResults);
                })
                .onError((error) => {
                    this.logOut && console.log('Error in command: ', this.command);
                    this.logOut && console.log(error);
                    localError = error;
                    // reject(error);
                })
                .onData((data) => {
                    this.logOut && console.log(data.toString());
                    localData.push(data.toString());
                })
                .onErrorData((data) => {
                    if(!localError) {
                        localError = "Subprocess error"
                    }
                    this.logOut && console.log('ERROR: ', data.toString());
                    localErrorData.push(data.toString());
                })
                .execute();
        });
    }

    public from(path: string): Rsync {
        this.setMappedValue('local', path);
        return this;
    }

    public remote(remote: string): Rsync {
        this.remoteHost = remote;
        return this;
    }

    public to(remotePath: string): Rsync {
        this.remotePath = remotePath;
        return this;
    }

    public exclude(...globPattern: Array<string>): Rsync {
        globPattern = globPattern.flat();

        for (const pattern of globPattern) {
            this.addOption(`--exclude=${pattern}`);
        }
        return this;
    }
}
