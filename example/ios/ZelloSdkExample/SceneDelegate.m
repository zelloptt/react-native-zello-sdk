#import "SceneDelegate.h"
#import "AppDelegate.h"

#import <React/RCTLinkingManager.h>

@implementation SceneDelegate

- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)connectionOptions
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }

  NSURL *url = connectionOptions.URLContexts.anyObject.URL;
  NSDictionary *launchOptions = url ? @{UIApplicationLaunchOptionsURLKey : url} : nil;

  AppDelegate *appDelegate = (AppDelegate *)UIApplication.sharedApplication.delegate;
  self.window = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
  [appDelegate.reactNativeFactory startReactNativeWithModuleName:@"ZelloSdkExample"
                                                        inWindow:self.window
                                               initialProperties:@{}
                                                   launchOptions:launchOptions];
}

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  NSURL *url = URLContexts.anyObject.URL;
  if (url) {
    [RCTLinkingManager application:UIApplication.sharedApplication openURL:url options:@{}];
  }
}

@end
