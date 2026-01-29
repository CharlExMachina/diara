import { input, password, select, checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';

export async function promptForToken() {
  console.log(chalk.yellow('\n🔑 No GitHub token found. Let\'s set one up!'));
  console.log(chalk.gray('   Create a token at: https://github.com/settings/tokens'));
  console.log(chalk.gray('   Required scope: delete_repo\n'));

  const token = await password({
    message: 'Enter your GitHub Personal Access Token:',
    mask: '*'
  });

  return token;
}

export async function promptFindMethod() {
  return await select({
    message: 'How would you like to find repositories?',
    choices: [
      { name: 'Search by name', value: 'search' },
      { name: 'Filter by criteria', value: 'filter' },
      { name: 'Show all', value: 'all' }
    ]
  });
}

export async function promptSearch() {
  return await input({
    message: 'Search repos (partial match):'
  });
}

export async function promptFilter(repos) {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  const zeroStarsCount = repos.filter(r => r.stars === 0).length;
  const forksCount = repos.filter(r => r.isFork).length;
  const nonForksCount = repos.filter(r => !r.isFork).length;
  const olderThan1Year = repos.filter(r => r.updatedAt < oneYearAgo).length;
  const olderThan2Years = repos.filter(r => r.updatedAt < twoYearsAgo).length;

  return await select({
    message: 'Filter repositories by:',
    choices: [
      { name: `Show all repositories (${repos.length})`, value: 'all' },
      { name: `Only repos with 0 stars (${zeroStarsCount})`, value: 'zero-stars' },
      { name: `Only forked repos (${forksCount})`, value: 'forks' },
      { name: `Only non-forked repos (${nonForksCount})`, value: 'non-forks' },
      { name: `Not updated in 1+ year (${olderThan1Year})`, value: 'older-1-year' },
      { name: `Not updated in 2+ years (${olderThan2Years})`, value: 'older-2-years' }
    ]
  });
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

export async function promptSelectRepos(repos) {
  if (repos.length === 0) {
    return [];
  }

  const choices = repos.map(repo => ({
    name: `${repo.name} (⭐ ${repo.stars}, updated ${formatTimeAgo(repo.updatedAt)})${repo.isFork ? ' [fork]' : ''}${repo.isPrivate ? ' [private]' : ''}`,
    value: repo
  }));

  return await checkbox({
    message: 'Select repositories to delete (space to select, enter to confirm):',
    choices: choices,
    pageSize: 15
  });
}

export async function promptConfirmDeletion(repos) {
  console.log(chalk.red('\n⚠️  You are about to DELETE these repositories:'));
  repos.forEach(repo => {
    console.log(chalk.red(`   • ${repo.fullName}`));
  });
  console.log(chalk.red('\n   This action is IRREVERSIBLE!\n'));

  const confirmation = await input({
    message: 'Type "DELETE" to confirm:'
  });

  return confirmation === 'DELETE';
}

export async function promptContinue() {
  return await confirm({
    message: 'Would you like to delete more repositories?',
    default: false
  });
}
