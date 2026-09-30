const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { main } = require('../setup-ios');

const fixture = (name) => path.join(__dirname, 'fixtures', `${name}.podfile`);

function sink() {
  let text = '';
  return {
    write: (s) => (text += s),
    get text() {
      return text;
    },
  };
}

async function run(argv, cwd) {
  const stdout = sink();
  const stderr = sink();
  const code = await main(argv, { stdout, stderr, cwd });
  return { code, out: stdout.text, err: stderr.text };
}

describe('setup-ios CLI', () => {
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zello-setup-'));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const place = (name, rel = 'ios/Podfile') => {
    const target = path.join(dir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(fixture(name), target);
    return target;
  };

  it('applies with --yes and is idempotent', async () => {
    const podfile = place('readme-3x');
    const first = await run(['setup-ios', '--yes'], dir);
    expect(first.code).toBe(0);
    expect(first.out).toContain('+    zello_post_install(');
    expect(fs.readFileSync(podfile, 'utf8')).toContain(
      'zello_post_install(installer'
    );
    const second = await run(['setup-ios', '--yes'], dir);
    expect(second.code).toBe(0);
    expect(second.out).toContain('already set up');
  });

  it('--dry-run prints a diff and writes nothing', async () => {
    const podfile = place('rn086-template');
    const before = fs.readFileSync(podfile, 'utf8');
    const r = await run(['setup-ios', '--dry-run'], dir);
    expect(r.code).toBe(0);
    expect(r.out).toContain('--- a/');
    expect(fs.readFileSync(podfile, 'utf8')).toBe(before);
  });

  it('refuses to write without --yes when not interactive', async () => {
    place('rn086-template');
    const r = await main(['setup-ios'], {
      stdout: sink(),
      stderr: sink(),
      cwd: dir,
      stdin: null,
    });
    // stdin null + non-TTY test runner -> refuses
    expect(r).toBe(1);
  });

  it('finds the Podfile via --project-root (monorepo)', async () => {
    place('monorepo', 'apps/mobile/ios/Podfile');
    const r = await run(
      ['setup-ios', '--yes', '--project-root', 'apps/mobile'],
      dir
    );
    expect(r.code).toBe(0);
    expect(
      fs.readFileSync(path.join(dir, 'apps/mobile/ios/Podfile'), 'utf8')
    ).toContain("app_target: 'MonoApp'");
  });

  it('accepts --podfile and explicit targets', async () => {
    const podfile = place('ambiguous', 'custom/Podfile');
    const r = await run(
      [
        'setup-ios',
        '--yes',
        '--podfile',
        podfile,
        '--app-target',
        'AppTwo',
        '--extension-target',
        'AppOne',
      ],
      dir
    );
    expect(r.code).toBe(0);
  });

  it('errors with a hint when the Podfile is missing', async () => {
    const r = await run(['setup-ios', '--yes'], dir);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/--project-root/);
  });

  it('exits 2 and writes nothing when manual steps are needed', async () => {
    const podfile = place('ambiguous');
    const before = fs.readFileSync(podfile, 'utf8');
    const r = await run(['setup-ios', '--yes'], dir);
    expect(r.code).toBe(2);
    expect(r.err).toContain('Manual step required');
    expect(fs.readFileSync(podfile, 'utf8')).toBe(before);
  });

  it('rejects unknown arguments', async () => {
    const r = await run(['setup-ios', '--nope'], dir);
    expect(r.code).toBe(1);
  });
});
