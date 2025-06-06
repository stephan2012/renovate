import upath from 'upath';
import { regEx } from '../../../util/regex';
import { api as gradleVersioning } from '../../versioning/gradle';
import type { PackageDependency } from '../types';
import type {
  GradleManagerData,
  PackageVariables,
  VariableRegistry,
} from './types';

const artifactRegex = regEx(
  '^[a-zA-Z][-_a-zA-Z0-9]*(?:\\.[a-zA-Z0-9][-_a-zA-Z0-9]*?)*$',
);

const versionLikeRegex = regEx('^(?<version>[-_.\\[\\](),a-zA-Z0-9+ ]+)');

// Extracts version-like and range-like strings from the beginning of input
export function versionLikeSubstring(
  input: string | null | undefined,
): string | null {
  if (!input) {
    return null;
  }

  const match = versionLikeRegex.exec(input);
  const version = match?.groups?.version?.trim();
  if (!version || !regEx(/\d/).test(version)) {
    return null;
  }

  if (!gradleVersioning.isValid(version)) {
    return null;
  }

  return version;
}

export function isDependencyString(input: string): boolean {
  const [depNotation, ...extra] = input.split('@');
  if (extra.length > 1) {
    return false;
  }

  const parts = depNotation.split(':');
  if (parts.length !== 3 && parts.length !== 4) {
    return false;
  }

  const [groupId, artifactId, version, classifier] = parts;

  return !!(
    groupId &&
    artifactId &&
    version &&
    artifactRegex.test(groupId) &&
    artifactRegex.test(artifactId) &&
    (!classifier || artifactRegex.test(classifier)) &&
    version === versionLikeSubstring(version)
  );
}

export function parseDependencyString(
  input: string,
): PackageDependency<GradleManagerData> | null {
  if (!isDependencyString(input)) {
    return null;
  }

  const [depNotation, dataType] = input.split('@');
  const [groupId, artifactId, currentValue] = depNotation.split(':');

  return {
    depName: `${groupId}:${artifactId}`,
    currentValue,
    ...(dataType && { dataType }),
  };
}

const gradleVersionsFileRegex = regEx('^versions\\.gradle(?:\\.kts)?$', 'i');
const gradleBuildFileRegex = regEx('^build\\.gradle(?:\\.kts)?$', 'i');

export function isGradleScriptFile(path: string): boolean {
  const filename = upath.basename(path).toLowerCase();
  return filename.endsWith('.gradle.kts') || filename.endsWith('.gradle');
}

export function isGradleVersionsFile(path: string): boolean {
  const filename = upath.basename(path);
  return gradleVersionsFileRegex.test(filename);
}

export function isGradleBuildFile(path: string): boolean {
  const filename = upath.basename(path);
  return gradleBuildFileRegex.test(filename);
}

export function isPropsFile(path: string): boolean {
  const filename = upath.basename(path).toLowerCase();
  return filename === 'gradle.properties';
}

export function isKotlinSourceFile(path: string): boolean {
  const filename = upath.basename(path).toLowerCase();
  return filename.endsWith('.kt');
}

export function isTOMLFile(path: string): boolean {
  const filename = upath.basename(path).toLowerCase();
  return filename.endsWith('.toml');
}

export function toAbsolutePath(packageFile: string): string {
  return upath.join(packageFile.replace(regEx(/^[/\\]*/), '/'));
}

function getFileRank(filename: string): number {
  if (isPropsFile(filename)) {
    return 0;
  }
  if (isGradleVersionsFile(filename)) {
    return 1;
  }
  if (isGradleBuildFile(filename)) {
    return 3;
  }
  return 2;
}

export function reorderFiles(packageFiles: string[]): string[] {
  return packageFiles.sort((x, y) => {
    const xAbs = toAbsolutePath(x);
    const yAbs = toAbsolutePath(y);

    const xDir = upath.dirname(xAbs);
    const yDir = upath.dirname(yAbs);

    if (xDir === yDir) {
      const xRank = getFileRank(xAbs);
      const yRank = getFileRank(yAbs);
      if (xRank === yRank) {
        if (xAbs > yAbs) {
          return 1;
        }
        if (xAbs < yAbs) {
          return -1;
        }
      } else if (xRank > yRank) {
        return 1;
      } else if (yRank > xRank) {
        return -1;
      }
    } else if (xDir.startsWith(yDir)) {
      return 1;
    } else if (yDir.startsWith(xDir)) {
      return -1;
    }

    return 0;
  });
}

export function getVars(
  registry: VariableRegistry,
  dir: string,
  vars: PackageVariables = registry[dir] || {},
): PackageVariables {
  const dirAbs = toAbsolutePath(dir);
  const parentDir = upath.dirname(dirAbs);
  if (parentDir === dirAbs) {
    return vars;
  }
  const parentVars = registry[parentDir] || {};
  return getVars(registry, parentDir, { ...parentVars, ...vars });
}

export function updateVars(
  registry: VariableRegistry,
  dir: string,
  newVars: PackageVariables,
): void {
  const oldVars = registry[dir] ?? {};
  registry[dir] = { ...oldVars, ...newVars };
}
