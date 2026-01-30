import chalk from 'chalk';
import ora from 'ora';
import { getToken, setToken, hasToken, clearToken } from './config.js';
import {
  initOctokit,
  validateToken,
  fetchAllRepos,
  deleteRepo,
  filterRepos,
  searchRepos,
  getTokenExpirationStatus
} from './github.js';
import {
  promptForToken,
  promptFindMethod,
  promptSearch,
  promptFilter,
  promptSelectRepos,
  promptConfirmDeletion,
  promptContinue,
  showTokenExpirationWarning
} from './prompts.js';

const showTitle = () => {
  console.log(chalk.yellow(`
        *  .  *       .   *   .    *    .
    .    *    ╭──────────────────╮   .   *
   *   .      │     D I A R A    │    .
        .     ╰──────────────────╯  *
    ˚ · .     ·  ˚   ˚  ·  . ˚   · ˚  ·
  `));
  console.log(chalk.gray('      Banish your abandoned repositories\n'));
};

type TokenPromptReason = 'first-time' | 'expired' | 'invalid';

const setupToken = async (reason?: TokenPromptReason) => {
  if (!reason && hasToken()) {
    return getToken();
  }

  const token = await promptForToken(reason ?? 'first-time');
  setToken(token);
  return token;
};

interface OctokitError extends Error {
  status?: number;
}

const isOctokitError = (error: Error): error is OctokitError => {
  return 'status' in error;
};

const main = async () => {
  try {
    showTitle();

    let token = await setupToken();
    initOctokit(token);

    const authSpinner = ora('Authenticating with GitHub...').start();
    let authenticated = false;

    while (!authenticated) {
      try {
        const { username, expiresAt } = await validateToken();
        const expirationStatus = getTokenExpirationStatus(expiresAt);

        if (expirationStatus === 'expired') {
          authSpinner.fail(chalk.red('Token expired'));
          clearToken();
          token = await setupToken('expired');
          initOctokit(token);
          continue;
        }

        authSpinner.succeed(chalk.green(`Authenticated as @${username}`));

        // Show warning if token is expiring soon
        if (expirationStatus === 'expiring-soon' && expiresAt) {
          showTokenExpirationWarning(expiresAt);
        } else if (expirationStatus === 'no-expiration') {
          console.log(chalk.gray('   💡 Tip: Consider setting an expiration on your token for better security.\n'));
        }

        authenticated = true;
      } catch (error) {
        authSpinner.fail(chalk.red('Authentication failed'));
        if (error instanceof Error) {
          if (isOctokitError(error) && error.status === 401) {
            // Token is invalid (could be expired, revoked, or malformed)
            clearToken();
            token = await setupToken('invalid');
            initOctokit(token);
            authSpinner.start('Authenticating with GitHub...');
            continue;
          } else {
            console.log(chalk.red(`\nError: ${error.message}`));
            process.exit(1);
          }
        }
        process.exit(1);
      }
    }

    let continueLoop = true;
    while (continueLoop) {
      const fetchSpinner = ora('Fetching repositories...').start();
      let allRepos;
      try {
        allRepos = await fetchAllRepos();
        fetchSpinner.succeed(chalk.green(`Found ${allRepos.length} repositories`));
      } catch (error) {
        fetchSpinner.fail(chalk.red('Failed to fetch repositories'));
        if (error instanceof Error) {
          console.log(chalk.red(`\nError: ${error.message}`));
        }
        process.exit(1);
      }

      if (allRepos.length === 0) {
        console.log(chalk.yellow('\nNo repositories found.'));
        process.exit(0);
      }

      const findMethod = await promptFindMethod();

      let filteredRepos;
      if (findMethod === 'search') {
        const query = await promptSearch();
        filteredRepos = searchRepos(allRepos, query);
        console.log(chalk.cyan(`\nFound ${filteredRepos.length} repos matching "${query}"`));
      } else if (findMethod === 'filter') {
        const filterType = await promptFilter(allRepos);
        filteredRepos = filterRepos(allRepos, filterType);
      } else {
        filteredRepos = allRepos;
      }

      if (filteredRepos.length === 0) {
        console.log(chalk.yellow('\nNo repositories match your criteria.'));
        continueLoop = await promptContinue();
        continue;
      }

      const selectedRepos = await promptSelectRepos(filteredRepos);

      if (selectedRepos.length === 0) {
        console.log(chalk.yellow('\nNo repositories selected.'));
        continueLoop = await promptContinue();
        continue;
      }

      const confirmed = await promptConfirmDeletion(selectedRepos);

      if (!confirmed) {
        console.log(chalk.yellow('\nDeletion cancelled.'));
        continueLoop = await promptContinue();
        continue;
      }

      console.log(chalk.cyan('\n🗑️  Deleting repositories...\n'));

      let successCount = 0;
      let failCount = 0;

      for (const repo of selectedRepos) {
        const deleteSpinner = ora(`Deleting ${repo.fullName}...`).start();
        try {
          await deleteRepo(repo.owner, repo.name);
          deleteSpinner.succeed(chalk.green(`Deleted ${repo.fullName}`));
          successCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          deleteSpinner.fail(chalk.red(`Failed to delete ${repo.fullName}: ${message}`));
          failCount++;
        }
      }

      console.log('');
      if (successCount > 0) {
        console.log(chalk.green(`✅ Successfully deleted ${successCount} repositor${successCount === 1 ? 'y' : 'ies'}`));
      }
      if (failCount > 0) {
        console.log(chalk.red(`❌ Failed to delete ${failCount} repositor${failCount === 1 ? 'y' : 'ies'}`));
      }

      continueLoop = await promptContinue();
    }

    console.log(chalk.cyan('\nGoodbye! 👋\n'));

  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log(chalk.yellow('\n\nOperation cancelled.\n'));
      process.exit(0);
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red(`\nUnexpected error: ${message}`));
    process.exit(1);
  }
};

main();
