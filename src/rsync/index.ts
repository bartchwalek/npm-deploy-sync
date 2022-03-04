import { CommandShell } from '../command-shell';

export interface RsyncConfig {}

export interface RsyncResults {}

export class Rsync extends CommandShell {
  private source: string;
  private destination: string;
  private user: string;
  private remoteHost: string;
  private remotePath: string;

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
          n: "rsync perform a trial run that doesn't make any changes ",
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

  public async sync(): Promise<RsyncResults> {
    return new Promise<RsyncResults>((resolve, reject) => {
      this.spawn()
        .onClose((reason) => {
          console.log(reason);
          resolve({} as RsyncResults);
        })
        .onError((error) => {
          console.log('Error in command: ', this.command);
          console.log(error);
          reject(error);
        })
        .onData((data) => {
          console.log(data.toString());
        })
        .onErrorData((data) => {
          console.log('ERROR: ', data.toString());
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

  public exclude(globPattern: string): Rsync {
    this.addOption(`--exclude=${globPattern}`);
    return this;
  }

}
