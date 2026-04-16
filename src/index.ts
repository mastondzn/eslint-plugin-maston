import { version } from '../package.json';
import * as rules from './rules';

const plugin = {
    meta: {
        name: 'maston',
        version,
    },
    // @keep-sorted
    rules: {
        'command-barrel-file': rules.commandBarrelFile,
    },
};

export default plugin;
