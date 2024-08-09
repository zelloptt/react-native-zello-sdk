#import "ZelloiOSSdkModuleBridge.h"

@interface RCT_EXTERN_MODULE(ZelloIOSSdkModule, NSObject)

RCT_EXTERN_METHOD(configure:(BOOL)isDebugBuild)

RCT_EXTERN_METHOD(connect:(NSString *)network username:(NSString *)username password:(NSString *)password)
RCT_EXTERN_METHOD(disconnect)

RCT_EXTERN_METHOD(setAccountStatus:(NSString *)status)

RCT_EXTERN_METHOD(selectContact:(NSString *)name isChannel:(BOOL)isChannel)

RCT_EXTERN_METHOD(startVoiceMessage:(NSString *)name isChannel:(BOOL)isChannel)
RCT_EXTERN_METHOD(stopVoiceMessage)

RCT_EXTERN_METHOD(sendImage:(NSString *)name isChannel:(BOOL)isChannel data:(NSArray)data)

RCT_EXTERN_METHOD(sendLocation:(NSString *)name isChannel:(BOOL)isChannel)

RCT_EXTERN_METHOD(sendText:(NSString *)name isChannel:(BOOL)isChannel text:(NSString *)text)

RCT_EXTERN_METHOD(sendAlert:(NSString *)name isChannel:(BOOL)isChannel text:(NSString *)text level:(NSString *)level)

RCT_EXTERN_METHOD(connectChannel:(NSString *)name)
RCT_EXTERN_METHOD(disconnectChannel:(NSString *)name)

RCT_EXTERN_METHOD(submitProblemReport)

RCT_EXTERN_METHOD(muteContact:(NSString *)name isChannel:(BOOL)isChannel)
RCT_EXTERN_METHOD(unmuteContact:(NSString *)name isChannel:(BOOL)isChannel)

RCT_EXTERN_METHOD(startEmergency)
RCT_EXTERN_METHOD(stopEmergency)

RCT_EXTERN_METHOD(getHistory:(NSString *)name isChannel:(BOOL)isChannel maxMessages:(NSInteger)maxMessages callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(playHistoryMessage:(NSString *)historyId contactName:(NSString *)contactName isChannel:(BOOL)isChannel)

RCT_EXTERN_METHOD(stopHistoryMessagePlayback)

RCT_EXTERN_METHOD(getHistoryImageData:(NSString *)historyId contactName:(NSString *)contactName isChannel:(BOOL)isChannel callback:(RCTResponseSenderBlock)callback)

@end
