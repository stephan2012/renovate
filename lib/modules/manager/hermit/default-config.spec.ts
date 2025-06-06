import { minimatch } from '../../../util/minimatch';
import { matchRegexOrGlobList } from '../../../util/string-match';
import { defaultConfig } from './default-config';

describe('modules/manager/hermit/default-config', () => {
  describe('excludeCommitPaths', () => {
    function miniMatches(target: string, patterns: string[]): boolean {
      return patterns.some((patt: string) => {
        return minimatch(patt, { dot: true }).match(target);
      });
    }

    it.each`
      path                          | expected
      ${'bin/hermit'}               | ${true}
      ${'gradle/bin/hermit'}        | ${true}
      ${'nested/module/bin/hermit'} | ${true}
      ${'nested/testbin/hermit'}    | ${false}
      ${'other'}                    | ${false}
      ${'nested/other'}             | ${false}
      ${'nested/module/other'}      | ${false}
    `('minimatches("$path") === $expected', ({ path, expected }) => {
      expect(miniMatches(path, defaultConfig.excludeCommitPaths)).toBe(
        expected,
      );
    });
  });

  describe('managerFilePatterns', () => {
    it.each`
      path                          | expected
      ${'bin/hermit'}               | ${true}
      ${'gradle/bin/hermit'}        | ${true}
      ${'nested/module/bin/hermit'} | ${true}
      ${'nested/testbin/hermit'}    | ${false}
      ${'other'}                    | ${false}
      ${'nested/other'}             | ${false}
      ${'nested/module/other'}      | ${false}
    `('matchRegexOrGlobList("$path") === $expected', ({ path, expected }) => {
      expect(
        matchRegexOrGlobList(path, defaultConfig.managerFilePatterns),
      ).toBe(expected);
    });
  });
});
