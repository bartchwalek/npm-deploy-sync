import { Readable, Writable } from 'node:stream';
import { ChildProcessByStdio } from 'child_process';

const { spawn } = require('child_process');

interface SpawnArgs {
  command: string;
  arguments: Array<any>;
}

type DataToAnyFn = (any) => any;

interface ExecutionListeners {
  stdoutdata: Array<DataToAnyFn>;
  stderrdata: Array<DataToAnyFn>;
  error: Array<DataToAnyFn>;
  close: Array<DataToAnyFn>;
}

class ExecutionController {
  private debugLevel: number = 5;
  private listeners: any = {
    stdoutdata: new Array<DataToAnyFn>(),
    stderrdata: new Array<DataToAnyFn>(),
    error: new Array<DataToAnyFn>(),
    close: new Array<DataToAnyFn>(),
  };

  protected process: ChildProcessByStdio<any, any, any>;

  private controller: AbortController;
  private childProcessFactory: () => ChildProcessByStdio<any, any, any>;

  public constructor(
    controller: AbortController,
    childProcessFactory: () => ChildProcessByStdio<Writable, Readable, Readable>,
  ) {
    this.controller = controller;
    this.childProcessFactory = childProcessFactory;
  }

  public isDebug(): boolean {
    return this.debugLevel > 0;
  }

  public onError(fn: DataToAnyFn): ExecutionController {
    this.listeners.error.push(fn);
    return this;
  }

  public onClose(fn: DataToAnyFn): ExecutionController {
    this.listeners.close.push(fn);
    return this;
  }

  public onData(fn: DataToAnyFn): ExecutionController {
    this.listeners.stdoutdata.push(fn);
    return this;
  }

  public onErrorData(fn: DataToAnyFn): ExecutionController {
    this.listeners.stderrdata.push(fn);
    return this;
  }

  public execute() {
    const childProcess = this.childProcessFactory();
    this.process = childProcess;
    childProcess.stdout.on('data', (data) => {
      this.listeners.stdoutdata.forEach((fn) => {
        fn(data);
      });
    });

    childProcess.stderr.on('data', (data) => {
      this.listeners.stderrdata.forEach((fn) => {
        fn(data);
      });
    });

    childProcess.on('error', (data) => {
      this.listeners.error.forEach((fn) => {
        fn(data);
      });
    });

    childProcess.stderr.on('close', (data) => {
      this.listeners.close.forEach((fn) => {
        fn(data);
      });
    });
  }

  public abort(): void {
    this.controller.abort();
  }
}

export interface ExecutionDescriptors {
  flags?: { [index: string]: string };
  options?: { [index: string]: string };
}

export class CommandShell {
  protected debugLevel = 5;
  private prefix: string = '';
  protected command: string;
  private postfix: string = '';
  private flagsPrefix: string = '-';
  protected descriptors: ExecutionDescriptors = {} as ExecutionDescriptors;

  private options: Array<string> = new Array<string>();
  private flags: Array<string> = new Array<string>();
  private kvArgumentMap: Map<string, string> = new Map<string, string>();
  private assignmentListMap: Map<string, string> = new Map<string, string>();

  private lastArg: string = '';

  constructor(
    command: string,
    flagsPrefix: string = '-',
    descriptors: ExecutionDescriptors = {} as ExecutionDescriptors,
  ) {
    this.command = command;
    this.flagsPrefix = flagsPrefix;
    this.descriptors = descriptors;
  }

  protected addOption(key: string, comment?: string) {
    if (!this.options.includes(key)) {
      this.isDebug() && console.log('Added option ', key, ` : ${this.descriptors.options[key]} ## ${comment}`);
      this.options.push(key);
    }
  }

  protected isDebug(): boolean {
    return this.debugLevel > 0;
  }

  protected addFlag(flag: string, comment?: string) {
    this.isDebug() && console.log('Added flag ', flag, ` : ${this.descriptors.flags[flag]} ## ${comment}`);
    this.flags.push(flag); // a flag can be doubled (as in double verbose 'vv')
  }

  protected removeFlag(flag: string): void {
    const i = this.flags.indexOf(flag);
    if (i >= 0) {
      this.flags.splice(i, 1); // removes a single occurence of a flag
    }
  }

  protected unsetFlag(flag: string): void {
    this.flags = this.flags.filter((f) => f !== flag); // removes all occurences of a flag
  }

  protected setFlag(flag: string): void {
    if (!this.flags.includes(flag)) {
      this.addFlag(flag);
    }
  }

  protected removeOption(key: string) {
    const i = this.options.indexOf(key);
    if (i >= 0) {
      this.options.splice(i, 1);
    }
  }

  protected setArgument(key: string, value: any): void {
    this.kvArgumentMap.set(key, value.toString());
  }

  protected removeArgument(key: string): void {
    this.kvArgumentMap.delete(key);
  }

  protected assignValue(key: string, value: any): void {
    this.assignmentListMap.set(key, value.toString());
  }

  protected removeValue(key: string): void {
    this.assignmentListMap.delete(key);
  }

  protected setLastArgument(value: string): void {
    this.lastArg = value;
  }

  protected spawn(): ExecutionController {
    const controller = new AbortController();
    const { signal } = controller;
    const constr: SpawnArgs = this.construct();
    this.isDebug() && console.log('Executing ', constr);
    this.isDebug() && console.log(`${constr.command} ${constr.arguments.join(' ')}`);
    const command = () => spawn(constr.command, constr.arguments, { signal });
    return new ExecutionController(controller, command);
  }

  private construct(): SpawnArgs {
    let argArray: Array<string> = new Array<string>();

    let flags = '';

    if (this.flags.length > 0) {
      for (const flag of this.flags) {
        flags += flag;
      }
      argArray.push(`${this.flagsPrefix}${this.flags}`);
    }

    for (const opt of this.options) {
      argArray.push(opt);
    }

    for (const kv of this.kvArgumentMap.entries()) {
      argArray.push(kv[0]);
      argArray.push(kv[1].toString());
    }

    for (const kv of this.assignmentListMap.entries()) {
      argArray.push(`${kv[0]}=${kv[1].toString()}`);
    }

    if (this.lastArg && this.lastArg.length > 0) {
      argArray.push(this.lastArg);
    }

    return {
      command: `${this.prefix}${this.command}${this.postfix}`,
      arguments: argArray,
    } as SpawnArgs;
  }
}