export function useRouter() {
  return {
    push: (path) => location.assign(path),
    replace: (path) => location.replace(path),
  };
}
