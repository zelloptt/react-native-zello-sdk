const fs = require('node:fs');
const path = require('node:path');
const { transformPodfile } = require('../podfile-transform');

const fixture = (name) =>
  fs.readFileSync(path.join(__dirname, 'fixtures', `${name}.podfile`), 'utf8');

const REQUIRE_RE =
  /require Pod::Executable\.execute_command\('node'[\s\S]*?scripts\/zello_pods\.rb[\s\S]*?\.strip\n\nprepare_react_native_project!/;

describe('transformPodfile', () => {
  it('migrates the RN 0.86 template', () => {
    const r = transformPodfile(fixture('rn086-template'));
    expect(r.manual).toEqual([]);
    expect(r.changed).toBe(true);
    expect(r.content).toMatch(REQUIRE_RE);
    expect(r.content).toContain("platform :ios, '17.0'");
    expect(r.content).toContain(
      "    zello_post_install(installer, app_target: 'HelloWorld', extension_targets: [])\n"
    );
    // helper call is the first line inside post_install
    expect(r.content).toMatch(
      /post_install do \|installer\|\n {4}zello_post_install\(/
    );
  });

  it('migrates an Expo-generated Podfile (non-literal platform is left alone)', () => {
    const r = transformPodfile(fixture('expo-generated'), {
      appTarget: 'myexpoapp',
      extensionTargets: ['ExpoNSE'],
    });
    expect(r.manual).toEqual([]);
    expect(r.content).toContain(
      "platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'"
    );
    expect(r.notes.join('\n')).toMatch(/not a literal version/);
    expect(r.content).toContain(
      "zello_post_install(installer, app_target: 'myexpoapp', extension_targets: ['ExpoNSE'])"
    );
    expect(r.content).toMatch(REQUIRE_RE);
  });

  it('migrates the 3.x README setup (resilient block + NSE pod)', () => {
    const r = transformPodfile(fixture('readme-3x'));
    expect(r.manual).toEqual([]);
    expect(r.content).not.toMatch(/BUILD_LIBRARY_FOR_DISTRIBUTION/);
    expect(r.content).not.toMatch(/ZelloSDK['"]/);
    expect(r.content).not.toMatch(/IMPORTANT/);
    expect(r.content).toContain("platform :ios, '17.0'");
    expect(r.content).toContain(
      "zello_post_install(installer, app_target: 'HelloWorld', extension_targets: ['NotificationServiceExtension'])"
    );
    expect(r.content).not.toMatch(/\n\n\n/);
  });

  it('migrates the pre-migration example Podfile', () => {
    const r = transformPodfile(fixture('example-3x'));
    expect(r.manual).toEqual([]);
    expect(r.content).not.toMatch(/zello_resilient_pods/);
    expect(r.content).not.toMatch(/BUILD_LIBRARY_FOR_DISTRIBUTION/);
    expect(r.content).not.toMatch(/pod "ZelloSDK"/);
    expect(r.content).toContain(
      'config.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = "17.2"'
    );
    expect(r.content).toContain("platform :ios, '17.2'");
    // nested ZelloSdkExampleTests target is not an app/extension candidate
    expect(r.content).toContain(
      "zello_post_install(installer, app_target: 'ZelloSdkExample', extension_targets: ['NotificationServiceExtension'])"
    );
  });

  it('handles a monorepo-style Podfile', () => {
    const r = transformPodfile(fixture('monorepo'));
    expect(r.manual).toEqual([]);
    expect(r.content).toContain("app_target: 'MonoApp'");
  });

  it('is a no-op on an already migrated Podfile', () => {
    const once = transformPodfile(fixture('readme-3x'));
    const twice = transformPodfile(once.content);
    expect(twice.manual).toEqual([]);
    expect(twice.changed).toBe(false);
    expect(twice.content).toBe(once.content);
  });

  it('requires manual steps for an ambiguous Podfile (two app targets)', () => {
    const r = transformPodfile(fixture('ambiguous'));
    expect(r.manual.join('\n')).toMatch(/More than one app target candidate/);
    expect(r.snippet).toContain('zello_post_install(installer');
  });

  it('honours explicit targets on an ambiguous Podfile', () => {
    const r = transformPodfile(fixture('ambiguous'), {
      appTarget: 'AppOne',
      extensionTargets: [],
    });
    expect(r.manual).toEqual([]);
    expect(r.content).toContain("app_target: 'AppOne'");
  });

  it('requires a manual step for an unrecognised resilient workaround', () => {
    const r = transformPodfile(fixture('unknown-resilient'));
    expect(r.manual.join('\n')).toMatch(/resilient-pods/);
  });

  it('requires a manual step when there is no post_install block', () => {
    const r = transformPodfile(
      "platform :ios, '17.0'\nprepare_react_native_project!\ntarget 'A' do\n  use_react_native!\nend\n"
    );
    expect(r.manual.join('\n')).toMatch(/No `post_install/);
    expect(r.snippet).toContain("app_target: 'A'");
  });

  it('flags leftover ZELLO_USE_SPM references', () => {
    const r = transformPodfile(
      `ENV['ZELLO_USE_SPM'] = '1'\n${fixture('rn086-template')}`
    );
    expect(r.manual.join('\n')).toMatch(/ZELLO_USE_SPM/);
  });

  it('ignores ZELLO_USE_SPM in comments', () => {
    const r = transformPodfile(
      `# ZELLO_USE_SPM is gone\n${fixture('rn086-template')}`
    );
    expect(r.manual).toEqual([]);
  });

  it('only auto-detects extension-like top-level targets', () => {
    const r = transformPodfile(
      `${fixture('rn086-template')}\ntarget 'ShareExtension' do\nend\n\ntarget 'Tools' do\nend\n`
    );
    expect(r.manual).toEqual([]);
    expect(r.content).toContain(
      "zello_post_install(installer, app_target: 'HelloWorld', extension_targets: ['ShareExtension'])"
    );
    expect(r.notes.join('\n')).toMatch(
      /Not treated as extension targets: Tools\. Pass --extension-target/
    );
  });

  it('does not lower a higher literal platform', () => {
    const r = transformPodfile(fixture('example-3x'));
    expect(r.content).not.toContain("platform :ios, '17.0'");
  });
});
