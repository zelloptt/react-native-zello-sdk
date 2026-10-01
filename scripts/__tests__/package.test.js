const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { REQUIRE_LINES } = require('../podfile-transform');

const ROOT = path.resolve(__dirname, '..', '..');
const NAME = '@zelloptt/react-native-zello-sdk';

// Packs the package and installs it into a throwaway consumer, as npm would (no network).
describe('packed package', () => {
  let dir;
  let consumer;
  let installed;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zello-pack-'));
    const out = execFileSync(
      'npm',
      ['pack', '--ignore-scripts', '--json', '--pack-destination', dir, ROOT],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    // npm 10 runs `prepare` despite --ignore-scripts; skip its log lines before the JSON.
    const json = JSON.parse(out.slice(out.search(/^\[/m)));
    const tarball = path.join(dir, json[0].filename);
    consumer = path.join(dir, 'consumer');
    installed = path.join(consumer, 'node_modules', ...NAME.split('/'));
    fs.mkdirSync(installed, { recursive: true });
    fs.mkdirSync(path.join(consumer, 'ios'));
    execFileSync('tar', [
      '-xzf',
      tarball,
      '-C',
      installed,
      '--strip-components=1',
    ]);
  }, 60000);
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('resolves zello_pods.rb with the exact Podfile require expression', () => {
    const expression = /^\s*"(.*)",$/.exec(REQUIRE_LINES[1])[1];
    // As `pod install` runs it: from ios/, with `__dir__` (the Podfile's directory) as argv[1].
    const ios = path.join(consumer, 'ios');
    const resolved = execFileSync('node', ['-p', expression, ios], {
      cwd: ios,
      encoding: 'utf8',
    }).trim();
    expect(resolved).toBe(
      fs.realpathSync(path.join(installed, 'scripts', 'zello_pods.rb'))
    );
    expect(
      fs.existsSync(path.join(installed, 'scripts', 'zello_sdk_requirement.rb'))
    ).toBe(true);
  });

  it('resolves the Expo config plugin', () => {
    const resolved = require.resolve(`${NAME}/app.plugin.js`, {
      paths: [consumer],
    });
    expect(resolved).toBe(
      fs.realpathSync(path.join(installed, 'app.plugin.js'))
    );
  });

  it('ships no tests or fixtures', () => {
    expect(fs.existsSync(path.join(installed, 'scripts', '__tests__'))).toBe(
      false
    );
  });
});
