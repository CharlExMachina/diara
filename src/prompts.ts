import { input, password, select, checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { Repository, FilterType } from './github.js';
import {
  t,
  setLanguage,
  getLanguageSetting,
  getLanguageDisplayName,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage
} from './i18n.js';

type FindMethod = 'search' | 'filter' | 'all' | 'settings';

// Symbol to indicate user wants to go back
export const BACK = Symbol('back');

export const promptForToken = async (reason?: 'first-time' | 'expired' | 'invalid') => {
  if (reason === 'expired') {
    console.log(chalk.red(`\n⚠️  ${t('token.setup.expired')}\n`));
    console.log(chalk.gray(`   ${t('token.setup.expiredHint')}`));
    console.log(chalk.gray(`   ${t('token.setup.expiredAction')}\n`));
  } else if (reason === 'invalid') {
    console.log(chalk.red(`\n⚠️  ${t('token.setup.invalid')}\n`));
    console.log(chalk.gray(`   ${t('token.setup.invalidHint')}`));
    console.log(chalk.gray(`   ${t('token.setup.expiredAction')}\n`));
  } else {
    console.log(chalk.yellow(`\n🔑 ${t('token.setup.firstTime')}\n`));
  }

  console.log(chalk.white(`   ${t('token.instructions.step1')} `) + chalk.cyan('https://github.com/settings/personal-access-tokens/new'));
  console.log(chalk.white(`   ${t('token.instructions.step2')} `) + chalk.gray(t('token.instructions.step2Hint')));
  console.log(chalk.white(`   ${t('token.instructions.step3')} `) + chalk.yellow('30 or 90 days') + chalk.gray(` ${t('token.instructions.step3Hint')}`));
  console.log(chalk.white(`   ${t('token.instructions.step4')} `) + chalk.yellow(t('token.instructions.step4Value')));
  console.log(chalk.white(`   ${t('token.instructions.step5')}`));
  console.log(chalk.gray('      • ') + chalk.white(`${t('token.instructions.step5Permission')} `) + chalk.yellow(t('token.instructions.step5Value')));
  console.log(chalk.white(`   ${t('token.instructions.step6')} `) + chalk.green(t('token.instructions.step6Button')) + chalk.white(` ${t('token.instructions.step6End')}\n`));

  console.log(chalk.gray(`   💡 ${t('token.instructions.tip')}\n`));

  return password({
    message: t('token.prompt'),
    mask: '*'
  });
};

export const showTokenExpirationWarning = (expiresAt: Date) => {
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry <= 0) {
    console.log(chalk.red(`\n⚠️  ${t('token.expiration.expired')}`));
  } else if (daysUntilExpiry === 1) {
    console.log(chalk.yellow(`\n⚠️  ${t('token.expiration.tomorrow')}`));
  } else {
    console.log(chalk.yellow(`\n⚠️  ${t('token.expiration.days', { days: daysUntilExpiry, date: expiresAt.toLocaleDateString() })}`));
  }
  console.log(chalk.gray(`   ${t('token.expiration.renewHint')} https://github.com/settings/personal-access-tokens/new\n`));
};

export const promptFindMethod = async (): Promise<FindMethod> => {
  return select({
    message: t('menu.findMethod'),
    choices: [
      { name: t('menu.searchByName'), value: 'search' as const },
      { name: t('menu.filterByCriteria'), value: 'filter' as const },
      { name: t('menu.showAll'), value: 'all' as const },
      { name: chalk.gray(`⚙️  ${t('menu.settings')}`), value: 'settings' as const }
    ]
  });
};

export const promptSearch = async (): Promise<string | typeof BACK> => {
  const result = await input({
    message: t('search.prompt')
  });

  if (result.trim() === '') {
    return BACK;
  }
  return result;
};

export const promptFilter = async (repos: Repository[]): Promise<FilterType | typeof BACK> => {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  const zeroStarsCount = repos.filter(r => r.stars === 0).length;
  const forksCount = repos.filter(r => r.isFork).length;
  const nonForksCount = repos.filter(r => !r.isFork).length;
  const olderThan1Year = repos.filter(r => r.updatedAt < oneYearAgo).length;
  const olderThan2Years = repos.filter(r => r.updatedAt < twoYearsAgo).length;

  type FilterChoice = FilterType | 'back';

  const result = await select<FilterChoice>({
    message: t('filter.prompt'),
    choices: [
      { name: chalk.gray(t('menu.back')), value: 'back' as const },
      { name: t('filter.all', { count: repos.length }), value: 'all' as const },
      { name: t('filter.zeroStars', { count: zeroStarsCount }), value: 'zero-stars' as const },
      { name: t('filter.forks', { count: forksCount }), value: 'forks' as const },
      { name: t('filter.nonForks', { count: nonForksCount }), value: 'non-forks' as const },
      { name: t('filter.older1Year', { count: olderThan1Year }), value: 'older-1-year' as const },
      { name: t('filter.older2Years', { count: olderThan2Years }), value: 'older-2-years' as const }
    ]
  });

  if (result === 'back') {
    return BACK;
  }
  return result;
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return t('time.daysAgo', { count: diffDays });
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? t('time.monthAgo', { count: months }) : t('time.monthsAgo', { count: months });
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? t('time.yearAgo', { count: years }) : t('time.yearsAgo', { count: years });
  }
};

type RepoSelection = { repos: Repository[] } | { back: true };

export const promptSelectRepos = async (repos: Repository[]): Promise<RepoSelection> => {
  if (repos.length === 0) {
    return { repos: [] };
  }

  // Create a special back marker type
  type ChoiceValue = Repository | 'back';

  const choices: Array<{ name: string; value: ChoiceValue }> = [
    { name: chalk.gray(t('menu.backHint')), value: 'back' as const },
    ...repos.map(repo => ({
      name: `${repo.name} (⭐ ${repo.stars}, ${formatTimeAgo(repo.updatedAt)})${repo.isFork ? t('select.fork') : ''}${repo.isPrivate ? t('select.private') : ''}`,
      value: repo as ChoiceValue
    }))
  ];

  const selected = await checkbox({
    message: t('select.prompt'),
    choices,
    pageSize: 15
  });

  // Check if back was selected
  if (selected.includes('back' as ChoiceValue)) {
    return { back: true };
  }

  // Filter out any non-repo values (type guard)
  const selectedRepos = selected.filter((item): item is Repository => item !== 'back');
  return { repos: selectedRepos };
};

export const promptConfirmDeletion = async (repos: Repository[]) => {
  console.log(chalk.red(`\n⚠️  ${t('delete.warning')}`));
  repos.forEach(repo => {
    console.log(chalk.red(`   • ${repo.fullName}`));
  });
  console.log(chalk.red(`\n   ${t('delete.irreversible')}\n`));

  const confirmWord = t('delete.confirmWord');
  const confirmation = await input({
    message: t('delete.confirmPrompt')
  });

  return confirmation === confirmWord;
};

export const promptContinue = async () => {
  return confirm({
    message: t('continue.prompt'),
    default: false
  });
};

// Settings menu
type SettingsAction = 'language' | 'back';

export const promptSettings = async (): Promise<SettingsAction> => {
  const currentLang = getLanguageSetting();
  const displayName = getLanguageDisplayName(currentLang);

  return select({
    message: t('settings.prompt'),
    choices: [
      { name: chalk.gray(t('settings.backToMain')), value: 'back' as const },
      { name: `${t('settings.changeLanguage')} (${displayName})`, value: 'language' as const }
    ]
  });
};

export const promptLanguageSelection = async (): Promise<SupportedLanguage | 'system' | typeof BACK> => {
  const currentSetting = getLanguageSetting();

  type LangChoice = SupportedLanguage | 'system' | 'back';

  const choices: Array<{ name: string; value: LangChoice }> = [
    { name: chalk.gray(t('menu.back')), value: 'back' as const },
    {
      name: `System ${currentSetting === 'system' ? chalk.green('✓') : ''}`,
      value: 'system' as const
    },
    ...SUPPORTED_LANGUAGES.map(lang => ({
      name: `${getLanguageDisplayName(lang)} ${currentSetting === lang ? chalk.green('✓') : ''}`,
      value: lang as LangChoice
    }))
  ];

  const result = await select<LangChoice>({
    message: t('settings.languagePrompt'),
    choices
  });

  if (result === 'back') {
    return BACK;
  }

  return result;
};

export const handleSettings = async (): Promise<void> => {
  let inSettings = true;

  while (inSettings) {
    const action = await promptSettings();

    if (action === 'back') {
      inSettings = false;
    } else if (action === 'language') {
      const langChoice = await promptLanguageSelection();
      if (langChoice !== BACK) {
        setLanguage(langChoice);
        const displayName = getLanguageDisplayName(langChoice);
        console.log(chalk.green(`\n✓ ${t('settings.languageChanged', { language: displayName })}\n`));
      }
    }
  }
};
