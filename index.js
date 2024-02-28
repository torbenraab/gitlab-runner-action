import { getInput, setFailed } from "@actions/core";
import { exec } from "@actions/exec";
import { resolve } from "path";

async function registerRunnerCmd() {
  let cmdArgs = [];
  cmdArgs.push(`--rm`);
  cmdArgs.push(`-v`, `/srv/gitlab-runner/config:/etc/gitlab-runner`);
  cmdArgs.push(`gitlab/gitlab-runner`);
  cmdArgs.push(`register`);
  cmdArgs.push(`--non-interactive`);
  cmdArgs.push(`--executor`, `docker`);
  cmdArgs.push(`--docker-image`, getInput("docker-image"));
  cmdArgs.push(`--url`, getInput("gitlab-instance"));
  cmdArgs.push(`--token`, getInput("token"));
  cmdArgs.push(`--name`, getInput("name"));
  cmdArgs.push(`--tag-list`, getInput("tag-list"));
  cmdArgs.push(`--docker-privileged`, true);
  cmdArgs.push(`--locked="false"`);
  cmdArgs.push(`--access-level="${getInput("access-level")}"`);
  cmdArgs.push(`--run-untagged="${getInput("run-untagged")}"`);

  await exec("docker run", cmdArgs);
}

async function unregisterRunnerCmd() {
  let cmdArgs = [];
  cmdArgs.push(`--rm`);
  cmdArgs.push(`-v`, `/srv/gitlab-runner/config:/etc/gitlab-runner`);
  cmdArgs.push(`gitlab/gitlab-runner`);
  cmdArgs.push(`unregister`);
  cmdArgs.push(`--name`, getInput("name"));

  await exec("docker run", cmdArgs);
}

async function startRunnerCmd() {
  let cmdArgs = [];
  cmdArgs.push(`-d`);
  cmdArgs.push(`--name`, `gitlab-runner`);
  cmdArgs.push(`--restart`, `always`);
  cmdArgs.push(`-v`, `/srv/gitlab-runner/config:/etc/gitlab-runner`);
  cmdArgs.push(`-v`, `/var/run/docker.sock:/var/run/docker.sock`);
  cmdArgs.push(`gitlab/gitlab-runner`);

  await exec("docker run", cmdArgs);
}

async function stopRunnerCmd() {
  let cmdArgs = [];
  cmdArgs.push(`gitlab-runner`);

  await exec("docker stop ", cmdArgs);
  await exec("docker rm ", cmdArgs);
}

async function checkJob() {
  await exec(`${resolve(__dirname, "dist")}/check-job.sh`);
}

async function registerRunner() {
  try {
    await registerRunnerCmd();
    await startRunnerCmd();
    await checkJob();
  } catch (err) {
    setFailed(err.message);
  } finally {
    await unregisterRunner();
  }
}

async function unregisterRunner() {
  await stopRunnerCmd();
  await unregisterRunnerCmd();
}

registerRunner();
