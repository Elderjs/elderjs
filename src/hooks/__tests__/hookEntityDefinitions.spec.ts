import { hookEntityDefinitions } from '../hookEntityDefinitions';
import hookInterface from '../hookInterface';

test('#hookEntityDefinitions', async () => {
  const entities = [...new Set(hookInterface.reduce((out, hook) => [...out, ...hook.props, ...hook.mutable], []))];
  const definitions = Object.keys(hookEntityDefinitions);
  entities.forEach((entity) => expect(definitions).toContain(entity));
});
