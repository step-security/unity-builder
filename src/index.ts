import * as core from '@actions/core';
import * as github from '@actions/github';
import axios, { isAxiosError } from 'axios';
import { Action, BuildParameters, Cache, Docker, ImageTag, Output } from './model';
import MacBuilder from './model/mac-builder';
import PlatformSetup from './model/platform-setup';
import { Plugin, loadPlugin } from './model/plugin';

async function validateSubscription() {
  const repoPrivate = github.context?.payload?.repository?.private;
  const upstream = 'game-ci/unity-builder';
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl = 'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';

  core.info('');
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false) core.info('\u001b[32m\u2713 Free for public repositories\u001b[0m');
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  core.info('');

  if (repoPrivate === false) return;

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body: Record<string, string> = { action: action || '' };
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      { timeout: 3000 },
    );
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(`\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`);
      core.error(`\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`);
      process.exit(1);
    }
    core.info('Timeout or API not reachable. Continuing to next step.');
  }
}
// Exported so tests can drive the lifecycle directly without depending on
// vitest's module re-loading (which changed in vitest 4).
export async function runMain() {
  try {
    await validateSubscription();
    Action.checkCompatibility();
    Cache.verify();

    const { workspace, actionFolder } = Action;
    const buildParameters = await BuildParameters.create();
    const baseImage = new ImageTag(buildParameters);

    // Load optional plugin. The default implementation is @game-ci/orchestrator.
    const plugin = await loadPlugin();
    await plugin?.initialize(buildParameters, workspace);

    let exitCode = -1;

    if (plugin?.canHandleBuild()) {
      // Plugin handles the build entirely (remote providers, hot runner, test workflows)
      const result = await plugin.handleBuild(baseImage.toString());

      exitCode = result.fallbackToLocal
        ? await runLocalBuild(buildParameters, baseImage, workspace, actionFolder, plugin)
        : result.exitCode;
    } else if (buildParameters.providerStrategy === 'local') {
      exitCode = await runLocalBuild(buildParameters, baseImage, workspace, actionFolder, plugin);
    } else {
      throw new Error(
        `Provider strategy "${buildParameters.providerStrategy}" requires @game-ci/orchestrator. ` +
          'Install it via the game-ci/orchestrator action, or use providerStrategy=local.',
      );
    }

    // Set core outputs
    await Output.setBuildVersion(buildParameters.buildVersion);
    await Output.setAndroidVersionCode(buildParameters.androidVersionCode);
    await Output.setEngineExitCode(exitCode);

    // Plugin handles post-build (artifacts, archiving, retention)
    await plugin?.handlePostBuild(exitCode);

    if (exitCode !== 0) {
      core.setFailed(`Build failed with exit code ${exitCode}`);
    }
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

async function runLocalBuild(
  buildParameters: BuildParameters,
  baseImage: ImageTag,
  workspace: string,
  actionFolder: string,
  plugin?: Plugin,
): Promise<number> {
  await plugin?.beforeLocalBuild(workspace);

  await PlatformSetup.setup(buildParameters, actionFolder);
  const exitCode =
    process.platform === 'darwin'
      ? await MacBuilder.run(actionFolder)
      : await Docker.run(baseImage.toString(), {
          workspace,
          actionFolder,
          ...buildParameters,
        });

  await plugin?.afterLocalBuild(workspace, exitCode);

  return exitCode;
}

// Auto-run when this module is the entry point. Tests import the file via
// `await import('./index')` purely to register the mock factories and then
// call `runMain()` directly.
if (process.env.NODE_ENV !== 'test') {
  runMain();
}
