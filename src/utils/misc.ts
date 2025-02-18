import { getArrayInput } from '@technote-space/github-action-helper/dist/utils';
import fs from 'fs';
import path from 'path';
import { Context } from '@actions/github/lib/context';
import { Utils } from '@technote-space/github-action-helper';
import { getInput } from '@actions/core' ;
import {
	DEFAULT_COMMIT_MESSAGE,
	DEFAULT_COMMIT_NAME,
	DEFAULT_COMMIT_EMAIL,
	DEFAULT_SEARCH_BUILD_COMMAND_TARGETS,
	DEFAULT_BRANCH_NAME,
	DEFAULT_CLEAN_TARGETS,
	DEFAULT_OUTPUT_BUILD_INFO_FILENAME,
	DEFAULT_FETCH_DEPTH,
	DEFAULT_TEST_TAG_PREFIX,
	DEFAULT_ORIGINAL_TAG_PREFIX,
} from '../constant';

const {getWorkspace, escapeRegExp, getBoolValue, uniqueArray, isSemanticVersioningTagName} = Utils;

const getCleanTargets = (): string[] => [...new Set<string>((getInput('CLEAN_TARGETS') || DEFAULT_CLEAN_TARGETS).split(',').map(target => target.trim()).filter(target => target && !target.startsWith('/') && !target.includes('..')))];

const normalizeCommand = (command: string): string => command.trim().replace(/\s{2,}/g, ' ');

export const getSearchBuildCommandTargets = (): string[] => {
	const command = getInput('BUILD_COMMAND_TARGET');
	if (command) {
		return [command];
	}
	return DEFAULT_SEARCH_BUILD_COMMAND_TARGETS;
};

export const detectBuildCommand = (dir: string): boolean | string => {
	const packageFile = path.resolve(dir, 'package.json');
	if (!fs.existsSync(packageFile)) {
		return false;
	}

	const parsed = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
	if (!('scripts' in parsed)) {
		return false;
	}

	const scripts = parsed['scripts'];
	for (const target of getSearchBuildCommandTargets()) {
		if (target in scripts) {
			return normalizeCommand(target);
		}
	}

	return false;
};

export const getBuildCommands = (dir: string): string[] => {
	let commands    = getArrayInput('BUILD_COMMAND', false, '&&').map(normalizeCommand);
	const addRemove = !commands.length;

	const buildCommand      = detectBuildCommand(dir);
	// eslint-disable-next-line no-magic-numbers
	const hasInstallCommand = commands.filter(command => command.includes('npm run install') || command.includes('yarn install')).length > 0;

	if (typeof buildCommand === 'string') {
		commands = commands.filter(command => !command.startsWith(`npm run ${buildCommand}`) && !command.startsWith(`yarn ${buildCommand}`));
		commands.push(`yarn ${buildCommand}`);
	}

	// eslint-disable-next-line no-magic-numbers
	if (!hasInstallCommand && commands.length > 0) {
		commands.unshift('yarn install');
	}

	if (!hasInstallCommand) {
		commands.push('yarn install --production');
	}

	if (addRemove) {
		commands.push(...getCleanTargets().map(target => `rm -rdf ${target}`));
	}

	return commands;
};

export const getCommitMessage = (): string => getInput('COMMIT_MESSAGE') || DEFAULT_COMMIT_MESSAGE;

export const getCommitName = (): string => getInput('COMMIT_NAME') || DEFAULT_COMMIT_NAME;

export const getCommitEmail = (): string => getInput('COMMIT_EMAIL') || DEFAULT_COMMIT_EMAIL;

export const getBranchName = (): string => getInput('BRANCH_NAME') || DEFAULT_BRANCH_NAME;

export const getFetchDepth = (): number => {
	const depth = getInput('FETCH_DEPTH');
	if (depth && /^\d+$/.test(depth)) {
		return parseInt(depth, 10);
	}
	return DEFAULT_FETCH_DEPTH;
};

export const getTestTagPrefix = (): string => getInput('TEST_TAG_PREFIX') || DEFAULT_TEST_TAG_PREFIX;

const getTestTagPrefixRegExp = (): RegExp => new RegExp('^' + escapeRegExp(getTestTagPrefix()));

export const isTestTag = (tagName: string): boolean => !!getTestTagPrefix() && getTestTagPrefixRegExp().test(tagName);

export const getTestTag = (tagName: string): string => tagName.replace(getTestTagPrefixRegExp(), '');

export const getOriginalTagPrefix = (): string => getInput('ORIGINAL_TAG_PREFIX') || DEFAULT_ORIGINAL_TAG_PREFIX;

export const isCreateMajorVersionTag = (): boolean => getBoolValue(getInput('CREATE_MAJOR_VERSION_TAG') || 'true');

export const isCreateMinorVersionTag = (): boolean => getBoolValue(getInput('CREATE_MINOR_VERSION_TAG') || 'true');

export const isCreatePatchVersionTag = (): boolean => getBoolValue(getInput('CREATE_PATCH_VERSION_TAG') || 'true');

export const getOutputBuildInfoFilename = (): string => {
	const filename = (getInput('OUTPUT_BUILD_INFO_FILENAME') || DEFAULT_OUTPUT_BUILD_INFO_FILENAME).trim();
	if (filename.startsWith('/') || filename.includes('..')) {
		return '';
	}
	return filename;
};

const getVersionFragments = (tagName: string): string[] => tagName.trim().replace(/^v?/gi, '').split('.');

type createTagType = (tagName: string) => string;

// eslint-disable-next-line no-magic-numbers
export const getMajorTag = (tagName: string): string => 'v' + getVersionFragments(tagName).slice(0, 1).join('.');

// eslint-disable-next-line no-magic-numbers
export const getMinorTag = (tagName: string): string => 'v' + getVersionFragments(tagName).concat(['0']).slice(0, 2).join('.');

// eslint-disable-next-line no-magic-numbers
export const getPatchTag = (tagName: string): string => 'v' + getVersionFragments(tagName).concat(['0', '0']).slice(0, 3).join('.');

export const isValidTagName = (tagName: string): boolean => isSemanticVersioningTagName(tagName) || (isTestTag(tagName) && isSemanticVersioningTagName(getTestTag(tagName)));

export const getCreateTags = (tagName: string): string[] => {
	const settings  = [
		{condition: isCreateMajorVersionTag, createTag: getMajorTag},
		{condition: isCreateMinorVersionTag, createTag: getMinorTag},
		{condition: isCreatePatchVersionTag, createTag: getPatchTag},
	];
	const createTag = isTestTag(tagName) ? (create: createTagType): string => getTestTagPrefix() + create(getTestTag(tagName)) : (create: createTagType): string => create(tagName);

	return uniqueArray(settings.filter(setting => setting.condition()).map(setting => createTag(setting.createTag)).concat(tagName));
};

export const getParams = (): { workDir: string; buildDir: string; pushDir: string; branchName: string } => {
	const workDir    = path.resolve(getWorkspace(), '.work');
	const buildDir   = path.resolve(workDir, 'build');
	const pushDir    = path.resolve(workDir, 'push');
	const branchName = getBranchName();
	return {workDir, buildDir, pushDir, branchName};
};

export const getReplaceDirectory = (): object => {
	const {workDir, buildDir, pushDir} = getParams();
	return {
		[buildDir]: '<Build Directory>',
		[pushDir]: '<Push Directory>',
		[workDir]: '<Working Directory>',
	};
};

export const isValidContext = (context: Context): boolean => isValidTagName(Utils.getTagName(context));
