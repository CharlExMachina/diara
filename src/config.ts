import Conf from 'conf';

interface ConfigSchema {
  githubToken: string;
}

const config = new Conf<ConfigSchema>({
  projectName: 'diara',
  projectSuffix: '',
  schema: {
    githubToken: {
      type: 'string',
      default: ''
    }
  }
});

export const getToken = () => config.get('githubToken');

export const setToken = (token: string) => config.set('githubToken', token);

export const clearToken = () => config.delete('githubToken');

export const hasToken = () => {
  const token = getToken();
  return token.length > 0;
};
