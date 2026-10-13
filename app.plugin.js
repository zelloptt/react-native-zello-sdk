'use strict';

/**
 * Expo config plugin: migrates the generated Podfile to the SwiftPM-based native ZelloSDK and
 * makes sure extension targets meet the iOS 17.0 deployment target.
 *
 *   "plugins": [["@zelloptt/react-native-zello-sdk", { "extensionTargets": ["NotificationServiceExtension"] }]]
 *
 * The app's deployment target itself comes from `expo-build-properties`
 * (`ios.deploymentTarget: "17.0"`). Expo runs mods in reverse plugin order, so list this plugin
 * before any plugin that creates the extension target.
 */

const {
  createRunOncePlugin,
  withPodfile,
  withXcodeProject,
} = require('expo/config-plugins');
const {
  MIN_IOS,
  compareVersions,
  transformPodfile,
} = require('./scripts/podfile-transform');
const pkg = require('./package.json');

const unquote = (s) => String(s).replace(/^"(.*)"$/, '$1');

/** Raises IPHONEOS_DEPLOYMENT_TARGET to MIN_IOS on the named native targets (xcode project object). */
function setExtensionDeploymentTarget(project, extensionTargets) {
  const lists = project.pbxXCConfigurationList();
  const configs = project.pbxXCBuildConfigurationSection();
  const sections = project.pbxNativeTargetSection();
  const targets = Object.keys(sections)
    .map((key) => sections[key])
    .filter((target) => typeof target === 'object');
  const missing = extensionTargets.filter(
    (name) => !targets.some((target) => unquote(target.name) === name)
  );
  if (missing.length) {
    throw new Error(
      `[react-native-zello-sdk] Extension target(s) ${missing.join(', ')} not found in the Xcode project. ` +
        'List @zelloptt/react-native-zello-sdk before the plugin that creates them (Expo runs mods in reverse order).'
    );
  }
  targets.forEach((target) => {
    if (!extensionTargets.includes(unquote(target.name))) {
      return;
    }
    const list = lists[target.buildConfigurationList];
    (list ? list.buildConfigurations : []).forEach(({ value }) => {
      const settings = configs[value].buildSettings;
      const current = settings.IPHONEOS_DEPLOYMENT_TARGET;
      if (!current || compareVersions(unquote(current), MIN_IOS) < 0) {
        settings.IPHONEOS_DEPLOYMENT_TARGET = MIN_IOS;
      }
    });
  });
  return project;
}

function withZelloSdk(config, props = {}) {
  const extensionTargets = (props && props.extensionTargets) || [];
  if (
    !Array.isArray(extensionTargets) ||
    !extensionTargets.every((name) => typeof name === 'string' && name)
  ) {
    throw new Error(
      '[react-native-zello-sdk] `extensionTargets` must be an array of target names (strings).'
    );
  }

  config = withPodfile(config, (cfg) => {
    const result = transformPodfile(cfg.modResults.contents, {
      appTarget: cfg.modRequest.projectName,
      extensionTargets,
    });
    if (result.manual.length) {
      throw new Error(
        `[react-native-zello-sdk] Could not migrate the Podfile:\n - ${result.manual.join('\n - ')}` +
          (result.snippet ? `\n\n${result.snippet}` : '')
      );
    }
    cfg.modResults.contents = result.content;
    return cfg;
  });

  if (extensionTargets.length) {
    config = withXcodeProject(config, (cfg) => {
      setExtensionDeploymentTarget(cfg.modResults, extensionTargets);
      return cfg;
    });
  }
  return config;
}

module.exports = createRunOncePlugin(withZelloSdk, pkg.name, pkg.version);
module.exports.setExtensionDeploymentTarget = setExtensionDeploymentTarget;
