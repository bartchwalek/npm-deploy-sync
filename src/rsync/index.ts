import {CommandShell} from '../command-shell';
import {ErrorCodesDescriptors, LinuxExitCode} from '../error-codes/error-codes';

export interface RsyncConfig {
    useSshPass?: boolean;
    useGPG?: boolean;
}

export interface RsyncResults extends ExecutionResults {
}

export interface ExecutionData {
    error: any;
    data: any;
}

export interface SyncRemoteFileTransferEngine extends RemoteFileTransferEngine {
    sync(): Promise<ExecutionResults>;
}

export interface CopyRemoteFileTransferEngine extends RemoteFileTransferEngine {
    copy(): Promise<ExecutionResults>;
}

export interface FileTransferEngineSecurity {
    password(passwordOrFile: string): this;
}

export interface RemoteFileTransferEngine {
    as(user: string): this;

    to(remote: string): this;

    from(path: string): this;

    into(path: string): this;

}

export interface RsyncFormattedResults extends RsyncResults {
    formatted?: {
        files: {
            sent: number,
            sentType: string,
            received: number,
            receivedType: string,
            speed: number,
            speedType: string,
            list: Array<string>;
        }
    };
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

export class Rsync extends CommandShell implements SyncRemoteFileTransferEngine, FileTransferEngineSecurity {
    private source: string;
    private destination: string;
    private user: string;
    private remoteHost: string;
    private remotePath: string;

    private prespawn;

    private logOut: boolean = true;

    private returned: { [index: string]: RsyncResults } = {};

    protected config: RsyncConfig;

    constructor(configuration: RsyncConfig = {}, debugLevel: number = 5) {
        super(
            configuration.useSshPass || configuration.useGPG ? 'sshpass' : 'rsync',
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
            configuration.useSshPass || configuration.useGPG
                ? `$special $flags $options $map[local] $map[dest]`
                : '$flags $options $map[local] $map[dest]',
            () => {
                this.setupDestination();
            },
            (...args) => {
                return this.sync();
            },
            debugLevel
        );
        this.config = configuration;

        this.logOutput(this.isDebug());

    }

    public setupDestination(): void {
        this.destination = `${this.remoteHost}:${this.remotePath ? this.remotePath : '/'}`;
        this.setMappedValue('dest', `${this.user ? this.user + '@' : ''}${this.destination}`);
    }

    public as(user: string): this {
        return this.asRemoteUser(user);
    }

    public asRemoteUser(username: string): this {
        this.user = username;
        return this;
    }

    public async getFormattedResults(pid: string = 'main'): Promise<RsyncFormattedResults> {
        return new Promise<RsyncFormattedResults>(((resolve, reject) => {

            this.getProcess(pid).then(ec => {
                ec.onClose((reason) => {
                    const data = ec.getDataString();
                    let filelist = data.split(`sending incremental file list\n`);
                    if (filelist && filelist.length > 1) {
                        let f = filelist[1];
                        let files = '';

                        let sent = 0;
                        let sentType = 'bytes';
                        let received = 0;
                        let receivedType = 'bytes';
                        let speed = 0;
                        let speedType = 'bytes/sec';
                        let totalSize = 0;

                        f = f.replace(/sent ([0-9,]+) (\w+)\s+received ([0-9,]+)\s(\w+)\s+([0-9,]+).+?\s(\S+)\ntotal size is ([0-9,]+)\s+/gmi, (...args) => {
                            files = f.substring(0, args[8]).trim();
                            sent = parseInt(args[1].replaceAll(',', ''));
                            sentType = args[2];
                            received = parseInt(args[3].replaceAll(',', ''));
                            receivedType = args[4];
                            speed = parseInt(args[5].replaceAll(',', ''));
                            speedType = args[6];
                            totalSize = parseInt(args[7].replaceAll(',', ''));

                            return '';

                        });

                        if (files) {
                            filelist = files.split('\n');
                            filelist.map(f => {
                                return f.trim();
                            });
                        } else {
                            filelist = [];
                        }

                        let ret = this.returned[pid] as RsyncFormattedResults;

                        ret.formatted = {
                            files: {
                                sent,
                                sentType,
                                received,
                                receivedType,
                                speed,
                                speedType,
                                list: filelist as Array<string>
                            }
                        };

                        resolve(ret as RsyncFormattedResults);

                    }
                });
            });

        }));
    }

    public include(): Rsync {
        return this;
    }

    public update(): Rsync {
        this.addFlag('u');
        return this;
    }

    public setClearTextPassword(password: string): this {
        this.addSpecial(['-p', `${password}`, 'rsync']);
        return this;
    }

    public setGPG(file: string): this {
        this.addSpecial(['rsync']);
        this.prespawn = {command: 'gpg', args: ['-d', '-q', `${file}`]};
        return this;
    }

    public password(fileOrString: string): this {
        if (this.config.useSshPass) {
            return this.setClearTextPassword(fileOrString);
        }
        if (this.config.useGPG) {
            return this.setGPG(fileOrString);
        }
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

    public async sync(pid: string = 'main'): Promise<RsyncResults> {
        let localErrorData = [];
        let localData = [];
        let localError;
        return new Promise<RsyncResults>((resolve, reject) => {
            this.spawn(pid)
                .onClose((reason) => {
                    this.logOut && console.log(reason);

                    this.returned[pid] = {
                        hasError: !!localError,
                        error: localError,
                        exitCode: reason,
                        description: ErrorCodesDescriptors[reason],
                        success: reason === LinuxExitCode.SUCCESS,
                        data: {
                            data: localData,
                            error: localErrorData,
                        },
                    } as RsyncResults;
                    resolve(this.returned[pid]);
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
                    if (!localError) {
                        localError = 'Subprocess error';
                    }
                    this.logOut && console.log('ERROR: ', data.toString());
                    localErrorData.push(data.toString());
                })
                .execute(this.prespawn);
        });
    }

    public from(path: string): this {
        this.setMappedValue('local', path);
        return this;
    }

    public to(remoteHost: string): this {
        this.remoteHost = remoteHost;
        return this;
    }

    public pathRemote(remotePath: string): this {
        this.remotePath = remotePath;
        return this;
    }

    public into(remotePath: string): this {
        return this.pathRemote(remotePath);
    }

    public exclude(...globPattern: Array<string>): Rsync {
        globPattern = globPattern.flat();

        for (const pattern of globPattern) {
            this.addOption(`--exclude=${pattern}`);
        }
        return this;
    }
}
