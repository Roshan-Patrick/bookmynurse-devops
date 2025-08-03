import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  APIEndpoint: "http://103.91.186.102:30008/api/"  
};
