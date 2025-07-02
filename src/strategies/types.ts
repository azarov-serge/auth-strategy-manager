import { AxiosRequestConfig } from 'axios';

export type UrlConfig = {
  url: string;
  method?: AxiosRequestConfig['method'];
};
