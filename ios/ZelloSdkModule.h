#ifdef RCT_NEW_ARCH_ENABLED
#import "RNZelloSdkSpec.h"

@interface ZelloSdkModule : NSObject <NativeZelloSdkSpec>
@end
#else
#import <React/RCTBridgeModule.h>

@interface ZelloSdkModule : NSObject <RCTBridgeModule>
@end
#endif
