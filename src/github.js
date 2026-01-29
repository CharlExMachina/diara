import { Octokit } from '@octokit/rest';

let octokit = null;

export function initOctokit(token) {
  octokit = new Octokit({ auth: token });
}

export async function validateToken() {
  if (!octokit) {
    throw new Error('Octokit not initialized. Call initOctokit first.');
  }

  const { data } = await octokit.users.getAuthenticated();
  return data.login;
}

export async function fetchAllRepos() {
  if (!octokit) {
    throw new Error('Octokit not initialized. Call initOctokit first.');
  }

  const repos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: perPage,
      page: page,
      sort: 'updated',
      direction: 'desc'
    });

    repos.push(...data);

    if (data.length < perPage) {
      break;
    }
    page++;
  }

  return repos.map(repo => ({
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    description: repo.description || '',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    isFork: repo.fork,
    updatedAt: new Date(repo.updated_at),
    createdAt: new Date(repo.created_at),
    isPrivate: repo.private
  }));
}

export async function deleteRepo(owner, repoName) {
  if (!octokit) {
    throw new Error('Octokit not initialized. Call initOctokit first.');
  }

  await octokit.repos.delete({
    owner: owner,
    repo: repoName
  });
}

export function filterRepos(repos, filterType) {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  switch (filterType) {
    case 'zero-stars':
      return repos.filter(r => r.stars === 0);
    case 'forks':
      return repos.filter(r => r.isFork);
    case 'non-forks':
      return repos.filter(r => !r.isFork);
    case 'older-1-year':
      return repos.filter(r => r.updatedAt < oneYearAgo);
    case 'older-2-years':
      return repos.filter(r => r.updatedAt < twoYearsAgo);
    case 'all':
    default:
      return repos;
  }
}

export function searchRepos(repos, query) {
  const lowerQuery = query.toLowerCase();
  return repos.filter(r => r.name.toLowerCase().includes(lowerQuery));
}
