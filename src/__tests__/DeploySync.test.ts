import { DeploySync } from '../deploy-sync';

test('DeploySync', () => {
  expect<string>(DeploySync.className).toBe('DeploySync');
});
