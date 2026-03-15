import { spawn } from "node:child_process";

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function runCommand(
  command: string,
  args: string[],
  options: { stdin?: Buffer | string } = {},
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe" });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      });
    });

    if (options.stdin !== undefined) {
      child.stdin.write(options.stdin);
    }
    child.stdin.end();
  });
}
