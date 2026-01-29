import chalk from 'chalk';
import ora from 'ora';
import { getToken, setToken, hasToken } from './config.js';
import {
  initOctokit,
  validateToken,
  fetchAllRepos,
  deleteRepo,
  filterRepos,
  searchRepos
} from './github.js';
import {
  promptForToken,
  promptFindMethod,
  promptSearch,
  promptFilter,
  promptSelectRepos,
  promptConfirmDeletion,
  promptContinue
} from './prompts.js';

function showTitle() {
  console.log(chalk.yellow(`
        *  .  *       .   *   .    *    .
    .    *    ╭──────────────────╮   .   *
   *   .      │     D I A R A    │    .
        .     ╰──────────────────╯  *
    ˚ · .     ·  ˚   ˚  ·  . ˚   · ˚  ·
  `));
  console.log(chalk.gray('      Banish your abandoned repositories\n'));
}

async function setupToken() {
  if (hasToken()) {
    return getToken();
  }

  const token = await promptForToken();
  setToken(token);
  return token;
}

async function main() {
  try {
    // Show title screen
    showTitle();

    // Setup and validate token
    const token = await setupToken();
    initOctokit(token);

    const authSpinner = ora('Authenticating with GitHub...').start();
    let username;
    try {
      username = await validateToken();
      authSpinner.succeed(chalk.green(`Authenticated as @${username}`));
    } catch (error) {
      authSpinner.fail(chalk.red('Authentication failed'));
      if (error.status === 401) {
        console.log(chalk.red('\nInvalid token. Please check your token and try again.'));
        console.log(chalk.gray('You can create a new token at: https://github.com/settings/tokens'));
        console.log(chalk.gray('Run the command again to enter a new token.\n'));
        // Clear the invalid token
        const { clearToken } = await import('./config.js');
        clearToken();
      } else {
        console.log(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }

    // Main loop
    let continueLoop = true;
    while (continueLoop) {
      // Fetch repos
      const fetchSpinner = ora('Fetching repositories...').start();
      let allRepos;
      try {
        allRepos = await fetchAllRepos();
        fetchSpinner.succeed(chalk.green(`Found ${allRepos.length} repositories`));
      } catch (error) {
        fetchSpinner.fail(chalk.red('Failed to fetch repositories'));
        console.log(chalk.red(`\nError: ${error.message}`));
        process.exit(1);
      }

      if (allRepos.length === 0) {
        console.log(chalk.yellow('\nNo repositories found.'));
        process.exit(0);
      }

      // Get find method
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

      // Select repos
      const selectedRepos = await promptSelectRepos(filteredRepos);

      if (selectedRepos.length === 0) {
        console.log(chalk.yellow('\nNo repositories selected.'));
        continueLoop = await promptContinue();
        continue;
      }

      // Confirm deletion
      const confirmed = await promptConfirmDeletion(selectedRepos);

      if (!confirmed) {
        console.log(chalk.yellow('\nDeletion cancelled.'));
        continueLoop = await promptContinue();
        continue;
      }

      // Delete repos
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
          deleteSpinner.fail(chalk.red(`Failed to delete ${repo.fullName}: ${error.message}`));
          failCount++;
        }
      }

      // Summary
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
    if (error.name === 'ExitPromptError') {
      console.log(chalk.yellow('\n\nOperation cancelled.\n'));
      process.exit(0);
    }
    console.error(chalk.red(`\nUnexpected error: ${error.message}`));
    process.exit(1);
  }
}

main();
