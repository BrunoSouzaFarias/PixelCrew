export function getPath(fromX: number, toX: number): number[] {
  // Simple 1D pathfinding for side-scrolling view
  const path: number[] = [];
  const step = fromX < toX ? 1 : -1;
  for (let x = fromX; x !== toX; x += step) {
    path.push(x);
  }
  path.push(toX);
  return path;
}
