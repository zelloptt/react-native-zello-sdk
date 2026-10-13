#import "AppDelegate.h"
#import "ZelloSdkExample-Swift.h"

#import <RCTDefaultReactNativeFactoryDelegate.h>
#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

@interface ZelloSdkExampleReactNativeDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@implementation ZelloSdkExampleReactNativeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

@interface AppDelegate ()

// RCTReactNativeFactory holds its delegate weakly.
@property (nonatomic, strong) ZelloSdkExampleReactNativeDelegate *reactNativeDelegate;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.reactNativeDelegate = [ZelloSdkExampleReactNativeDelegate new];
  self.reactNativeDelegate.dependencyProvider = [RCTAppDependencyProvider new];
  _reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self.reactNativeDelegate];

  return YES;
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [self registerForRemoteNotificationsWithDeviceToken:deviceToken];
}

@end
