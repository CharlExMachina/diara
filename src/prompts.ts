import { input, password, select, checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { Repository, FilterType } from './github.js';

type FindMethod = 'search' | 'filter' | 'all';

export const promptForToken = async (reason?: 'first-time' | 'expired' | 'invalid') => {
  if (reason === 'expired') {
    console.log(chalk.red('\n⚠️  Your GitHub token has expired!\n'));
    console.log(chalk.gray('   For security, tokens should have expiration dates.'));
    console.log(chalk.gray('   Let\'s generate a new one:\n'));
  } else if (reason === 'invalid') {
    console.log(chalk.red('\n⚠️  Your GitHub token is invalid.\n'));
    console.log(chalk.gray('   It may have been revoked or the permissions changed.'));
    console.log(chalk.gray('   Let\'s generate a new one:\n'));
  } else {
    console.log(chalk.yellow('\n🔑 No GitHub token found. Let\'s set one up!\n'));
  }

  console.log(chalk.white('   1. Go to: ') + chalk.cyan('https://github.com/settings/personal-access-tokens/new'));
  console.log(chalk.white('   2. Token name: ') + chalk.gray('diara (or anything you like)'));
  console.log(chalk.white('   3. Expiration: ') + chalk.yellow('30 or 90 days') + chalk.gray(' (recommended for security)'));
  console.log(chalk.white('   4. Repository access: ') + chalk.yellow('"All repositories"'));
  console.log(chalk.white('   5. Permissions → Repository permissions:'));
  console.log(chalk.gray('      • ') + chalk.white('Administration: ') + chalk.yellow('"Read and write"'));
  console.log(chalk.white('   6. Click ') + chalk.green('"Generate token"') + chalk.white(' and copy it\n'));

  console.log(chalk.gray('   💡 Tip: Set an expiration date! Diara will remind you before it expires.\n'));

  return password({
    message: 'Paste your token here:',
    mask: '*'
  });
};

export const showTokenExpirationWarning = (expiresAt: Date) => {
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry <= 0) {
    console.log(chalk.red(`\n⚠️  Your token has expired!`));
  } else if (daysUntilExpiry === 1) {
    console.log(chalk.yellow(`\n⚠️  Your token expires tomorrow!`));
  } else {
    console.log(chalk.yellow(`\n⚠️  Your token expires in ${daysUntilExpiry} days (${expiresAt.toLocaleDateString()})`));
  }
  console.log(chalk.gray('   Generate a new token at: https://github.com/settings/personal-access-tokens/new\n'));
};

export const promptFindMethod = async (): Promise<FindMethod> => {
  return select({
    message: 'How would you like to find repositories?',
    choices: [
      { name: 'Search by name', value: 'search' as const },
      { name: 'Filter by criteria', value: 'filter' as const },
      { name: 'Show all', value: 'all' as const }
    ]
  });
};

export const promptSearch = async () => {
  return input({
    message: 'Search repos (partial match):'
  });
};

export const promptFilter = async (repos: Repository[]): Promise<FilterType> => {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  const zeroStarsCount = repos.filter(r => r.stars === 0).length;
  const forksCount = repos.filter(r => r.isFork).length;
  const nonForksCount = repos.filter(r => !r.isFork).length;
  const olderThan1Year = repos.filter(r => r.updatedAt < oneYearAgo).length;
  const olderThan2Years = repos.filter(r => r.updatedAt < twoYearsAgo).length;

  return select({
    message: 'Filter repositories by:',
    choices: [
      { name: `Show all repositories (${repos.length})`, value: 'all' as const },
      { name: `Only repos with 0 stars (${zeroStarsCount})`, value: 'zero-stars' as const },
      { name: `Only forked repos (${forksCount})`, value: 'forks' as const },
      { name: `Only non-forked repos (${nonForksCount})`, value: 'non-forks' as const },
      { name: `Not updated in 1+ year (${olderThan1Year})`, value: 'older-1-year' as const },
      { name: `Not updated in 2+ years (${olderThan2Years})`, value: 'older-2-years' as const }
    ]
  });
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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
};

export const promptSelectRepos = async (repos: Repository[]): Promise<Repository[]> => {
  if (repos.length === 0) {
    return [];
  }

  const choices = repos.map(repo => ({
    name: `${repo.name} (⭐ ${repo.stars}, updated ${formatTimeAgo(repo.updatedAt)})${repo.isFork ? ' [fork]' : ''}${repo.isPrivate ? ' [private]' : ''}`,
    value: repo
  }));

  return checkbox({
    message: 'Select repositories to delete (space to select, enter to confirm):',
    choices,
    pageSize: 15
  });
};

export const promptConfirmDeletion = async (repos: Repository[]) => {
  console.log(chalk.red('\n⚠️  You are about to DELETE these repositories:'));
  repos.forEach(repo => {
    console.log(chalk.red(`   • ${repo.fullName}`));
  });
  console.log(chalk.red('\n   This action is IRREVERSIBLE!\n'));

  const confirmation = await input({
    message: 'Type "DELETE" to confirm:'
  });

  return confirmation === 'DELETE';
};

export const promptContinue = async () => {
  return confirm({
    message: 'Would you like to delete more repositories?',
    default: false
  });
};
