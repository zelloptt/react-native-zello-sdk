# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Install Dependencies
```
cd ..
yarn install
cd example
npm install
```

## Start the Metro Server

To start Metro, run the following command from the `example` folder:

```bash
npm start
```

## Start the Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

Install the dependencies:
```bash
cd ios
pod install

# OR using npm
npx pod-install
```

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run the app — you can also run it directly from within Android Studio and Xcode respectively.

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.
