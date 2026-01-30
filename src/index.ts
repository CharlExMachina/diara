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
  showTokenExpirationWarning,
  handleSettings,
  BACK
} from './prompts.js';
import { t } from './i18n.js';

const showTitle = () => {
  console.log(chalk.yellow(`
        *  .  *       .   *   .    *    .
    .    *    ╭──────────────────╮   .   *
   *   .      │     D I A R A    │    .
        .     ╰──────────────────╯  *
    ˚ · .     ·  ˚   ˚  ·  . ˚   · ˚  ·
  `));
  console.log(chalk.gray(`      ${t('title.subtitle')}\n`));
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

    const authSpinner = ora(t('auth.authenticating')).start();
    let authenticated = false;

    while (!authenticated) {
      try {
        const { username, expiresAt } = await validateToken();
        const expirationStatus = getTokenExpirationStatus(expiresAt);

        if (expirationStatus === 'expired') {
          authSpinner.fail(chalk.red(t('auth.tokenExpired')));
          clearToken();
          token = await setupToken('expired');
          initOctokit(token);
          continue;
        }

        authSpinner.succeed(chalk.green(t('auth.authenticated', { username })));

        // Show warning if token is expiring soon
        if (expirationStatus === 'expiring-soon' && expiresAt) {
          showTokenExpirationWarning(expiresAt);
        } else if (expirationStatus === 'no-expiration') {
          console.log(chalk.gray(`   💡 ${t('auth.tokenTip')}\n`));
        }

        authenticated = true;
      } catch (error) {
        authSpinner.fail(chalk.red(t('auth.failed')));
        if (error instanceof Error) {
          if (isOctokitError(error) && error.status === 401) {
            // Token is invalid (could be expired, revoked, or malformed)
            clearToken();
            token = await setupToken('invalid');
            initOctokit(token);
            authSpinner.start(t('auth.authenticating'));
            continue;
          } else {
            console.log(chalk.red(`\n${t('error.unexpected', { message: error.message })}`));
            process.exit(1);
          }
        }
        process.exit(1);
      }
    }

    let continueLoop = true;
    while (continueLoop) {
      const fetchSpinner = ora(t('repos.fetching')).start();
      let allRepos;
      try {
        allRepos = await fetchAllRepos();
        fetchSpinner.succeed(chalk.green(t('repos.found', { count: allRepos.length })));
      } catch (error) {
        fetchSpinner.fail(chalk.red(t('repos.fetchFailed')));
        if (error instanceof Error) {
          console.log(chalk.red(`\n${t('error.unexpected', { message: error.message })}`));
        }
        process.exit(1);
      }

      if (allRepos.length === 0) {
        console.log(chalk.yellow(`\n${t('repos.none')}`));
        process.exit(0);
      }

      // Inner loop for navigation - allows going back to find method
      let filteredRepos: typeof allRepos | null = null;

      findMethodLoop: while (filteredRepos === null) {
        const findMethod = await promptFindMethod();

        if (findMethod === 'settings') {
          await handleSettings();
          continue findMethodLoop;
        } else if (findMethod === 'search') {
          const query = await promptSearch();
          if (query === BACK) {
            continue findMethodLoop;
          }
          filteredRepos = searchRepos(allRepos, query);
          console.log(chalk.cyan(`\n${t('search.found', { count: filteredRepos.length, query })}`));
        } else if (findMethod === 'filter') {
          const filterType = await promptFilter(allRepos);
          if (filterType === BACK) {
            continue findMethodLoop;
          }
          filteredRepos = filterRepos(allRepos, filterType);
        } else {
          filteredRepos = allRepos;
        }

        if (filteredRepos.length === 0) {
          console.log(chalk.yellow(`\n${t('repos.noMatch')}`));
          filteredRepos = null; // Reset to show find method again
          continue findMethodLoop;
        }
      }

      const selection = await promptSelectRepos(filteredRepos);

      if ('back' in selection) {
        // User wants to go back to find method
        continue;
      }

      const selectedRepos = selection.repos;

      if (selectedRepos.length === 0) {
        console.log(chalk.yellow(`\n${t('repos.noneSelected')}`));
        continueLoop = await promptContinue();
        continue;
      }

      const confirmed = await promptConfirmDeletion(selectedRepos);

      if (!confirmed) {
        console.log(chalk.yellow(`\n${t('delete.cancelled')}`));
        continueLoop = await promptContinue();
        continue;
      }

      console.log(chalk.cyan(`\n🗑️  ${t('delete.deleting')}\n`));

      let successCount = 0;
      let failCount = 0;

      for (const repo of selectedRepos) {
        const deleteSpinner = ora(t('delete.deletingRepo', { repo: repo.fullName })).start();
        try {
          await deleteRepo(repo.owner, repo.name);
          deleteSpinner.succeed(chalk.green(t('delete.deleted', { repo: repo.fullName })));
          successCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          deleteSpinner.fail(chalk.red(t('delete.deleteFailed', { repo: repo.fullName, error: message })));
          failCount++;
        }
      }

      console.log('');
      if (successCount > 0) {
        const successMsg = successCount === 1 ? t('delete.successCount', { count: successCount }) : t('delete.successCountPlural', { count: successCount });
        console.log(chalk.green(`✅ ${successMsg}`));
      }
      if (failCount > 0) {
        const failMsg = failCount === 1 ? t('delete.failCount', { count: failCount }) : t('delete.failCountPlural', { count: failCount });
        console.log(chalk.red(`❌ ${failMsg}`));
      }

      continueLoop = await promptContinue();
    }

    console.log(chalk.cyan(`\n${t('goodbye')} 👋\n`));

  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log(chalk.yellow(`\n\n${t('error.cancelled')}\n`));
      process.exit(0);
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red(`\n${t('error.unexpected', { message })}`));
    process.exit(1);
  }
};

main();
