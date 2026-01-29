import { Octokit } from '@octokit/rest';

export interface Repository {
  name: string;
  fullName: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  isFork: boolean;
  updatedAt: Date;
  createdAt: Date;
  isPrivate: boolean;
}

export type FilterType =
  | 'all'
  | 'zero-stars'
  | 'forks'
  | 'non-forks'
  | 'older-1-year'
  | 'older-2-years';

let octokit: Octokit | null = null;

export const initOctokit = (token: string) => {
  octokit = new Octokit({ auth: token });
};

const getOctokit = () => {
  if (!octokit) {
    throw new Error('Octokit not initialized. Call initOctokit first.');
  }
  return octokit;
};

export const validateToken = async () => {
  const { data } = await getOctokit().users.getAuthenticated();
  return data.login;
};

export const fetchAllRepos = async (): Promise<Repository[]> => {
  const client = getOctokit();
  const repos: Repository[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data } = await client.repos.listForAuthenticatedUser({
      per_page: perPage,
      page,
      sort: 'updated',
      direction: 'desc'
    });

    const mapped = data.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      description: repo.description ?? '',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      isFork: repo.fork,
      updatedAt: new Date(repo.updated_at ?? Date.now()),
      createdAt: new Date(repo.created_at ?? Date.now()),
      isPrivate: repo.private
    }));

    repos.push(...mapped);

    if (data.length < perPage) {
      break;
    }
    page++;
  }

  return repos;
};

export const deleteRepo = async (owner: string, repoName: string) => {
  await getOctokit().repos.delete({
    owner,
    repo: repoName
  });
};

export const filterRepos = (repos: Repository[], filterType: FilterType): Repository[] => {
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
      return repos;
  }
};

export const searchRepos = (repos: Repository[], query: string): Repository[] => {
  const lowerQuery = query.toLowerCase();
  return repos.filter(r => r.name.toLowerCase().includes(lowerQuery));
};
