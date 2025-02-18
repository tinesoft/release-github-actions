import { Context } from '@actions/github/lib/context';
import { isValidContext } from './utils/misc';

export const DEFAULT_COMMIT_MESSAGE               = 'feat: Build for release';
export const DEFAULT_COMMIT_NAME                  = 'GitHub Actions';
export const DEFAULT_COMMIT_EMAIL                 = 'example@example.com';
export const DEFAULT_BRANCH_NAME                  = 'gh-actions';
export const DEFAULT_CLEAN_TARGETS                = '.[!.]*,__tests__,src,*.js,*.ts,*.json,*.lock,_config.yml';
export const DEFAULT_OUTPUT_BUILD_INFO_FILENAME   = '';
export const DEFAULT_FETCH_DEPTH                  = 3;
export const DEFAULT_TEST_TAG_PREFIX              = '';
export const DEFAULT_ORIGINAL_TAG_PREFIX          = '';
export const DEFAULT_SEARCH_BUILD_COMMAND_TARGETS = [
	'build',
	'production',
	'prod',
];
export const TARGET_EVENTS                        = {
	'create': [
		(context: Context): boolean => isValidContext(context),
	],
	'release': [
		[
			'published',
			(context: Context): boolean => isValidContext(context),
		],
		[
			'rerequested',
			(context: Context): boolean => isValidContext(context),
		],
	],
	'push': [
		(context: Context): boolean => isValidContext(context),
	],
};
