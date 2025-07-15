import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  APIEndpoint: "http://localhost:3000/api/"
};
