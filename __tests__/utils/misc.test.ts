import path from 'path';
import {encodeContent} from '../util';
import {
    isTargetEvent,
    parseConfig,
    getCommitMessage,
    getCommitName,
    getCommitEmail,
    getBranchName,
    getWorkspace,
    getBuildCommands,
    getGitUrl,
    detectBuildCommand,
    getRepository,
    isValidTagName,
    getMajorTag,
    getMinorTag,
    uniqueArray,
    isCreateMajorVersionTag,
    isCreateMinorVersionTag,
    getCreateTags,
} from '../../src/utils/misc';
import {DEFAULT_COMMIT_MESSAGE, DEFAULT_COMMIT_NAME, DEFAULT_COMMIT_EMAIL, DEFAULT_BRANCH_NAME} from '../../src/constant';
import {describe} from 'jest-circus';

const testEnv = () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = {...OLD_ENV};
        delete process.env.NODE_ENV;
    });

    afterEach(() => {
        process.env = OLD_ENV;
    });
};

describe('isTargetEvent', () => {
    it('should return true', () => {
        expect(isTargetEvent({
            payload: {
                action: 'published',
            },
            eventName: 'release',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: '',
                repo: '',
            },
        })).toBeTruthy();
    });

    it('should return false', () => {
        expect(isTargetEvent({
            payload: {
                action: 'published',
            },
            eventName: 'push',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: '',
                repo: '',
            },
        })).toBeFalsy();
    });

    it('should return false', () => {
        expect(isTargetEvent({
            payload: {
                action: 'created',
            },
            eventName: 'release',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: '',
                repo: '',
            },
        })).toBeFalsy();
    });
});

describe('parseConfig', () => {
    it('should parse config', async () => {
        expect(parseConfig(encodeContent(''))).toEqual({});
        expect(parseConfig(encodeContent('a: b'))).toEqual({a: 'b'});
        expect(parseConfig(encodeContent('a:\n  - b\n  - c'))).toEqual({a: ['b', 'c']});
    });
});

describe('getCommitMessage', () => {
    testEnv();

    it('should get commit message', () => {
        process.env.INPUT_COMMIT_MESSAGE = 'test';
        expect(getCommitMessage()).toBe('test');
    });

    it('should get default commit message', () => {
        expect(getCommitMessage()).toBe(DEFAULT_COMMIT_MESSAGE);
    });
});

describe('getCommitName', () => {
    testEnv();

    it('should get commit name', () => {
        process.env.INPUT_COMMIT_NAME = 'test';
        expect(getCommitName()).toBe('test');
    });

    it('should get default commit name', () => {
        expect(getCommitName()).toBe(DEFAULT_COMMIT_NAME);
    });
});

describe('getCommitEmail', () => {
    testEnv();

    it('should get commit email', () => {
        process.env.INPUT_COMMIT_EMAIL = 'test';
        expect(getCommitEmail()).toBe('test');
    });

    it('should get default commit email', () => {
        expect(getCommitEmail()).toBe(DEFAULT_COMMIT_EMAIL);
    });
});

describe('getBranchName', () => {
    testEnv();

    it('should get branch name', () => {
        process.env.INPUT_BRANCH_NAME = 'test';
        expect(getBranchName()).toBe('test');
    });

    it('should get default branch name', () => {
        expect(getBranchName()).toBe(DEFAULT_BRANCH_NAME);
    });
});

describe('getWorkspace', () => {
    testEnv();

    it('should get workspace', () => {
        process.env.GITHUB_WORKSPACE = 'test';
        expect(getWorkspace()).toBe('test');
    });

    it('should not get workspace', () => {
        process.env.GITHUB_WORKSPACE = undefined;
        expect(getWorkspace()).toBe('');
    });
});

describe('getBuildCommands', () => {
    testEnv();

    it('should get build commands 1', () => {
        process.env.INPUT_BUILD_COMMAND = 'test';
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toEqual([
            'yarn install',
            'test',
            'yarn build', // build command of package.json
            'yarn install --production',
        ]);
    });

    it('should get build commands 2', () => {
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toEqual([
            'yarn install',
            'yarn build', // build command of package.json
            'yarn install --production',
            'rm -rdf .github',
            'rm -rdf __tests__',
            'rm -rdf src',
            'rm -rdf .gitignore',
            'rm -rdf *.js',
            'rm -rdf *.json',
            'rm -rdf *.lock',
        ]);
    });

    it('should get build commands 3', () => {
        process.env.INPUT_BUILD_COMMAND = 'yarn build';
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toEqual([
            'yarn install',
            'yarn build',
            'yarn install --production',
        ]);
    });

    it('should get build commands 4', () => {
        process.env.INPUT_BUILD_COMMAND = 'yarn install && yarn build';
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toEqual([
            'yarn install',
            'yarn build',
        ]);
    });

    it('should get build commands 5', () => {
        process.env.INPUT_BUILD_COMMAND = 'test';
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test1'))).toEqual([
            'yarn install',
            'test',
            'yarn install --production',
        ]);
    });

    it('should get build commands 6', () => {
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test1'))).toEqual([
            'yarn install --production',
            'rm -rdf .github',
            'rm -rdf __tests__',
            'rm -rdf src',
            'rm -rdf .gitignore',
            'rm -rdf *.js',
            'rm -rdf *.json',
            'rm -rdf *.lock',
        ]);
    });

    it('should get build commands 7', () => {
        process.env.INPUT_CLEAN_TARGETS = 'test';
        expect(getBuildCommands(path.resolve(__dirname, '..', 'fixtures', 'test1'))).toEqual([
            'yarn install --production',
            'rm -rdf test',
        ]);
    });
});

describe('getGitUrl', () => {
    testEnv();

    it('should return git url', () => {
        process.env.INPUT_ACCESS_TOKEN = 'test';
        expect(getGitUrl({
            payload: {
                action: '',
            },
            eventName: '',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: 'Hello',
                repo: 'World',
            },
        })).toBe('https://test@github.com/Hello/World.git');
    });
});

describe('detectBuildCommand', () => {
    it('should return false 1', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test1'))).toBeFalsy();
    });

    it('should return false 2', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test2'))).toBeFalsy();
    });

    it('should return false 2', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test3'))).toBeFalsy();
    });

    it('should detect build command 1', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test4'))).toBe('build');
    });

    it('should detect build command 1', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test5'))).toBe('production');
    });

    it('should detect build command 1', () => {
        expect(detectBuildCommand(path.resolve(__dirname, '..', 'fixtures', 'test6'))).toBe('prod');
    });
});

describe('getRepository', () => {
    it('should get repository', () => {
        expect(getRepository({
            payload: {
                action: '',
            },
            eventName: '',
            sha: '',
            ref: '',
            workflow: '',
            action: '',
            actor: '',
            issue: {
                owner: '',
                repo: '',
                number: 1,
            },
            repo: {
                owner: 'Hello',
                repo: 'World',
            },
        })).toBe('Hello/World');
    });
});

describe('isValidTagName', () => {
    it('should return true', () => {
        expect(isValidTagName('0')).toBeTruthy();
        expect(isValidTagName('v12')).toBeTruthy();
        expect(isValidTagName('1.2')).toBeTruthy();
        expect(isValidTagName('V1.2.3')).toBeTruthy();
        expect(isValidTagName('v12.23.34.45')).toBeTruthy();
    });

    it('should return false', () => {
        expect(isValidTagName('')).toBeFalsy();
        expect(isValidTagName('abc')).toBeFalsy();
        expect(isValidTagName('v1.')).toBeFalsy();
        expect(isValidTagName('v.9')).toBeFalsy();
    });
});

describe('getMajorTag', () => {
    it('should get major tag', () => {
        expect(getMajorTag('0')).toBe('v0');
        expect(getMajorTag('v12')).toBe('v12');
        expect(getMajorTag('1.2')).toBe('v1');
        expect(getMajorTag('V1.2.3')).toBe('v1');
        expect(getMajorTag('v12.23.34.45')).toBe('v12');
    });
});

describe('getMinorTag', () => {
    it('should get minor tag', () => {
        expect(getMinorTag('0')).toBe('v0.0');
        expect(getMinorTag('v12')).toBe('v12.0');
        expect(getMinorTag('1.2')).toBe('v1.2');
        expect(getMinorTag('V1.2.3')).toBe('v1.2');
        expect(getMinorTag('v12.23.34.45')).toBe('v12.23');
    });
});

describe('uniqueArray', () => {
    it('should return unique array', () => {
        expect(uniqueArray([])).toEqual([]);
        expect(uniqueArray<number>([1, 2, 2, 3, 4, 3])).toEqual([1, 2, 3, 4]);
        expect(uniqueArray<string>(['1', '2', '2', '3', '4', '3'])).toEqual(['1', '2', '3', '4']);
        expect(uniqueArray<string>(['v1.2', 'v1', 'v1.2'])).toEqual(['v1.2', 'v1']);
    });
});

describe('isCreateMajorVersionTag', () => {
    testEnv();

    it('should return true 1', () => {
        expect(isCreateMajorVersionTag()).toBeTruthy();
    });
    it('should return true 2', () => {
        process.env.INPUT_CREATE_MAJOR_VERSION_TAG = '1';
        expect(isCreateMajorVersionTag()).toBeTruthy();
    });
    it('should return true 3', () => {
        process.env.INPUT_CREATE_MAJOR_VERSION_TAG = 'abc';
        expect(isCreateMajorVersionTag()).toBeTruthy();
    });

    it('should return false 1', () => {
        process.env.INPUT_CREATE_MAJOR_VERSION_TAG = 'false';
        expect(isCreateMajorVersionTag()).toBeFalsy();
    });

    it('should return false 2', () => {
        process.env.INPUT_CREATE_MAJOR_VERSION_TAG = '0';
        expect(isCreateMajorVersionTag()).toBeFalsy();
    });
});

describe('isCreateMinorVersionTag', () => {
    testEnv();

    it('should return true 1', () => {
        expect(isCreateMinorVersionTag()).toBeTruthy();
    });
    it('should return true 2', () => {
        process.env.INPUT_CREATE_MINOR_VERSION_TAG = '1';
        expect(isCreateMinorVersionTag()).toBeTruthy();
    });
    it('should return true 3', () => {
        process.env.INPUT_CREATE_MINOR_VERSION_TAG = 'abc';
        expect(isCreateMinorVersionTag()).toBeTruthy();
    });

    it('should return false 1', () => {
        process.env.INPUT_CREATE_MINOR_VERSION_TAG = 'false';
        expect(isCreateMinorVersionTag()).toBeFalsy();
    });

    it('should return false 2', () => {
        process.env.INPUT_CREATE_MINOR_VERSION_TAG = '0';
        expect(isCreateMinorVersionTag()).toBeFalsy();
    });
});

describe('getCreateTags', () => {
    testEnv();

    it('should get create tags 1', () => {
        expect(getCreateTags('v1.2.3')).toEqual(['v1.2.3', 'v1', 'v1.2']);
    });
    it('should get create tags 2', () => {
        expect(getCreateTags('v1')).toEqual(['v1', 'v1.0']);
    });
    it('should get create tags 3', () => {
        expect(getCreateTags('v1.2')).toEqual(['v1.2', 'v1']);
    });
    it('should get create tags 4', () => {
        process.env.INPUT_CREATE_MAJOR_VERSION_TAG = 'false';
        expect(getCreateTags('v1.2.3')).toEqual(['v1.2.3', 'v1.2']);
    });
    it('should get create tags 5', () => {
        process.env.INPUT_CREATE_MINOR_VERSION_TAG = 'false';
        expect(getCreateTags('v1.2.3')).toEqual(['v1.2.3', 'v1']);
    });
    it('should get create tags 6', () => {
        process.env.INPUT_CREATE_MAJOR_VERSION_TAG = 'false';
        process.env.INPUT_CREATE_MINOR_VERSION_TAG = 'false';
        expect(getCreateTags('v1.2.3')).toEqual(['v1.2.3']);
    });
});