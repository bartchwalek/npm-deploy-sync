import {SecureShell} from '../secure-shell';
import {CopyRemoteFileTransferEngine, ExecutionResults, FileTransferEngineSecurity, RsyncResults} from '../rsync';
import {ErrorCodesDescriptors, LinuxExitCode} from '../error-codes/error-codes';

/**
 * scp copies files between hosts on a network. It uses ssh(1) for data transfer, and uses the same authentication and provides the same security as ssh(1). Unlike rcp(1), scp will ask for passwords or passphrases if they are needed for authentication.
 *
 * File names may contain a user and host specification to indicate that the file is to be copied to/from that host. Local file names can be made explicit using absolute or relative pathnames to avoid scp treating file names containing ':' as host specifiers. Copies between two remote hosts are also permitted.
 *
 * When copying a source file to a target file which already exists, scp will replace the contents of the target file (keeping the inode).
 *
 * If the target file does not yet exist, an empty file with the target file name is created, then filled with the source file contents. No attempt is made at "near-atomic" transfer using temporary files.
 */

export interface ScpExecutionResults extends ExecutionResults {
};

export class Scp extends SecureShell implements CopyRemoteFileTransferEngine, FileTransferEngineSecurity {

    protected local: string = '~/';
    protected remotePath: string = '~/';

    constructor(logLevel: number = 5) {
        super(logLevel, {
            command: 'scp',
            argumentsPreprocessMap: '$flags $args $options $map[src] $map[dest]'
        });
    }

    protected setupRemote(): void {
        this.remote = `${this.remoteHost}${this.remotePath ? ':' + this.remotePath : ''}`;
        this.local = `${this.local}`;
        this.setMappedValue('dest', `${this.remoteUser ? this.remoteUser + '@' : ''}${this.remote}`);
        this.setMappedValue('src', this.local);
    }

    public from(path: string): this {
        this.local = path;
        return this;
    }

    public pathRemote(path: string): this {
        this.remotePath = path;
        return this;
    }

    public port(port: number): this {
        this.setArgument('p', port);
        return this;
    }

    public into(path: string): this {
        return this.pathRemote(path);
    }

    public copy(processId?: string): Promise<ExecutionResults> {
        let localErrorData = [];
        let localData = [];
        let localError;
        return new Promise<ScpExecutionResults>((resolve, reject) => {
            this.spawn(processId)
                .onClose((reason) => {
                    this.isDebug() && console.log(reason);
                    resolve({
                        hasError: !!localError,
                        error: localError,
                        exitCode: reason,
                        description: ErrorCodesDescriptors[reason],
                        success: reason === LinuxExitCode.SUCCESS,
                        data: {
                            data: localData,
                            error: localErrorData,
                        },
                    } as ScpExecutionResults);
                })
                .onError((error) => {
                    this.isDebug() && console.log('Error in command: ', this.command);
                    this.isDebug() && console.log(error);
                    localError = error;
                    // reject(error);
                })
                .onData((data) => {
                    this.isDebug() && console.log(data.toString());
                    localData.push(data.toString());
                })
                .onErrorData((data) => {
                    if (!localError) {
                        localError = 'Subprocess error';
                    }
                    this.isDebug() && console.log('ERROR: ', data.toString());
                    localErrorData.push(data.toString());
                })
                .execute();
        });
    }

    public recursive(): Scp {
        this.addFlag('r');
        return this;
    }

}
