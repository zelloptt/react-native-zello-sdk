const path = require('path');
const pkg = require('../package.json');

module.exports = {
  project: {
    ios: {
      // SPM, not CocoaPods: never run `pod install` from `react-native run-ios`.
      automaticPodsInstallation: false,
    },
  },
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
    },
  },
};
