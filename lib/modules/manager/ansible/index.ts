import type { Category } from '../../../constants';
import { DockerDatasource } from '../../datasource/docker';
export { extractPackageFile } from './extract';

export const url = 'https://docs.ansible.com';
export const categories: Category[] = ['ansible', 'iac'];

export const defaultConfig = {
  managerFilePatterns: ['/(^|/)tasks/[^/]+\\.ya?ml$/'],
};

export const supportedDatasources = [DockerDatasource.id];
