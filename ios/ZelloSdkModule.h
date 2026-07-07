#import <React/RCTBridgeModule.h>

// Keep this header free of the generated spec import: the spec header
// (RNZelloSdkSpec.h) is Objective-C++ only, and this header is pulled into the
// pod's Swift umbrella. The `<NativeZelloSdkSpec>` conformance and the C++
// TurboModule glue live in ZelloSdkModule.mm instead.
@interface ZelloSdkModule : NSObject <RCTBridgeModule>
@end
