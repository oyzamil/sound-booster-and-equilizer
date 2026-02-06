import pkg from '@/../package.json';
export type PackageJson = typeof pkg;

export function readPackageJson(): PackageJson {
  return pkg; // ✔ Browser-safe
}

export function getPackageProp<K extends keyof PackageJson>(prop: K): PackageJson[K] {
  return pkg[prop];
}
