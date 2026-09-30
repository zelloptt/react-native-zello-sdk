const fs = require('node:fs');
const path = require('node:path');

const mods = {};
jest.mock(
  'expo/config-plugins',
  () => ({
    createRunOncePlugin: (fn) => fn,
    withPodfile: (config, action) => {
      mods.podfile = action;
      return config;
    },
    withXcodeProject: (config, action) => {
      mods.xcode = action;
      return config;
    },
  }),
  { virtual: true }
);

const plugin = require('../../app.plugin');

describe('Expo config plugin', () => {
  beforeEach(() => {
    delete mods.podfile;
    delete mods.xcode;
  });

  it('transforms the Podfile using the Expo project name', () => {
    plugin({}, { extensionTargets: ['ExpoNSE'] });
    const contents = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'expo-generated.podfile'),
      'utf8'
    );
    const cfg = mods.podfile({
      modRequest: { projectName: 'myexpoapp' },
      modResults: { contents },
    });
    expect(cfg.modResults.contents).toContain(
      "zello_post_install(installer, app_target: 'myexpoapp', extension_targets: ['ExpoNSE'])"
    );
  });

  it('throws when the Podfile needs manual changes', () => {
    plugin({});
    expect(() =>
      mods.podfile({
        modRequest: { projectName: 'x' },
        modResults: { contents: "target 'x' do\nend\n" },
      })
    ).toThrow(/Could not migrate the Podfile/);
  });

  it('only registers the Xcode mod when extension targets are given', () => {
    plugin({});
    expect(mods.xcode).toBeUndefined();
    plugin({}, { extensionTargets: ['ExpoNSE'] });
    expect(mods.xcode).toBeDefined();
  });

  it('raises the extension deployment target to 17.0', () => {
    const project = {
      pbxNativeTargetSection: () => ({
        a: { name: '"ExpoNSE"', buildConfigurationList: 'L1' },
        a_comment: 'ExpoNSE',
        b: { name: 'App', buildConfigurationList: 'L2' },
      }),
      pbxXCConfigurationList: () => ({
        L1: { buildConfigurations: [{ value: 'C1' }, { value: 'C2' }] },
        L2: { buildConfigurations: [{ value: 'C3' }] },
      }),
      pbxXCBuildConfigurationSection: () => cfgs,
    };
    const cfgs = {
      C1: { buildSettings: { IPHONEOS_DEPLOYMENT_TARGET: '15.1' } },
      C2: { buildSettings: { IPHONEOS_DEPLOYMENT_TARGET: '18.0' } },
      C3: { buildSettings: { IPHONEOS_DEPLOYMENT_TARGET: '15.1' } },
    };
    plugin.setExtensionDeploymentTarget(project, ['ExpoNSE']);
    expect(cfgs.C1.buildSettings.IPHONEOS_DEPLOYMENT_TARGET).toBe('17.0');
    expect(cfgs.C2.buildSettings.IPHONEOS_DEPLOYMENT_TARGET).toBe('18.0');
    expect(cfgs.C3.buildSettings.IPHONEOS_DEPLOYMENT_TARGET).toBe('15.1');
  });

  it('throws when a listed extension target is not in the Xcode project', () => {
    const project = {
      pbxNativeTargetSection: () => ({
        b: { name: 'App', buildConfigurationList: 'L2' },
        b_comment: 'App',
      }),
      pbxXCConfigurationList: () => ({}),
      pbxXCBuildConfigurationSection: () => ({}),
    };
    expect(() =>
      plugin.setExtensionDeploymentTarget(project, ['ExpoNSE'])
    ).toThrow(/ExpoNSE not found.*before the plugin that creates them/);
  });

  it.each([['ExpoNSE'], [['ExpoNSE', 1]], [{ name: 'ExpoNSE' }], [['']]])(
    'rejects extensionTargets %j',
    (extensionTargets) => {
      expect(() => plugin({}, { extensionTargets })).toThrow(
        /`extensionTargets` must be an array of target names/
      );
    }
  );
});
