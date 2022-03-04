import { DeploySync } from '../index';

test('DeploySync', () => {
  const d = new DeploySync();
  expect<string>(d.className).toBe('DeploySync');
});
