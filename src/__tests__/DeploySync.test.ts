import { DeploySync } from '../index';
import { Rsync } from '../rsync';

test('DeploySync', () => {
  const d = new DeploySync();
  expect<string>(d.className).toBe('DeploySync');
});
