import { DeploySync } from '../deploy-sync';

test('DeploySync', () => {
  expect<string>(DeploySync.classname).toBe('DeploySync');
});
