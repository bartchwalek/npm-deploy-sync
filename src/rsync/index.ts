import {CommandShell} from '../command-shell';

export interface RsyncConfig {

}

export interface RsyncResults {

}

export class Rsync extends CommandShell {

    private source: string;
    private destination: string;

    constructor(configuration: RsyncConfig) {
        super('rsync', '-', {
            flags: {
                u: 'skip files that are newer on the receiver',
                v: 'increase verbosity'
            }
        });
    }

    public asRemoteUser(username: string): Rsync {
        return this;
    }

    public include(): Rsync {
        return this;
    }

    public exclude(): Rsync {
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

    public overwrite(): Rsync {
        return this;
    }

    public async sync(): Promise<RsyncResults> {
        return new Promise<RsyncResults>(((resolve, reject) => {
            this.spawn().onClose((reason) => {
                console.log(reason);
                resolve({} as RsyncResults);
            }).onError((error) => {
                console.log('Error in command: ', this.command);
                console.log(error);
                reject(error);
            }).execute();
        }));
    }

    public from(): Rsync {
        return this;
    }

    public to(): Rsync {
        return this;
    }
}
