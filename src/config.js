import Conf from 'conf';

const config = new Conf({
  projectName: 'diara',
  schema: {
    githubToken: {
      type: 'string',
      default: ''
    }
  }
});

export function getToken() {
  return config.get('githubToken');
}

export function setToken(token) {
  config.set('githubToken', token);
}

export function clearToken() {
  config.delete('githubToken');
}

export function hasToken() {
  const token = getToken();
  return token && token.length > 0;
}
