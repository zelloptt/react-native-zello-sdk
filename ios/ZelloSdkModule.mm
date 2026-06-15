#import "ZelloSdkModule.h"

// Generated Swift interface header for this pod (module name derived from the
// podspec name `react-native-zello-sdk`). Use the framework-style import when
// built with use_frameworks!, falling back to the flat header otherwise.
#if __has_include(<react_native_zello_sdk/react_native_zello_sdk-Swift.h>)
#import <react_native_zello_sdk/react_native_zello_sdk-Swift.h>
#else
#import "react_native_zello_sdk-Swift.h"
#endif

#ifdef RCT_NEW_ARCH_ENABLED
// The generated spec header is Objective-C++ only, so it is imported here in
// the .mm rather than in the public .h. Conformance is declared via a class
// extension so the public interface stays Swift-umbrella safe.
#import "RNZelloSdkSpec.h"

@interface ZelloSdkModule () <NativeZelloSdkSpec>
@end
#endif

@implementation ZelloSdkModule {
  ZelloSdkModuleImpl *_impl;
}

RCT_EXPORT_MODULE(NativeZelloSdk)

- (instancetype)init {
  if (self = [super init]) {
    _impl = [ZelloSdkModuleImpl new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

#ifdef RCT_NEW_ARCH_ENABLED

- (void)configure:(NSDictionary *)config {
  [_impl configure:config];
}

- (void)connect:(NSString *)network username:(NSString *)username password:(NSString *)password {
  [_impl connect:network username:username password:password];
}

- (void)disconnect {
  [_impl disconnect];
}

- (void)setAccountStatus:(NSString *)status {
  [_impl setAccountStatus:status];
}

- (void)selectContact:(NSString *)name contactType:(NSString *)contactType {
  [_impl selectContact:name contactType:contactType];
}

- (void)startVoiceMessage:(NSString *)name contactType:(NSString *)contactType {
  [_impl startVoiceMessage:name contactType:contactType];
}

- (void)stopVoiceMessage {
  [_impl stopVoiceMessage];
}

- (void)sendImage:(NSString *)name contactType:(NSString *)contactType data:(NSArray *)data {
  [_impl sendImage:name contactType:contactType data:data];
}

- (void)sendLocation:(NSString *)name contactType:(NSString *)contactType {
  [_impl sendLocation:name contactType:contactType];
}

- (void)sendText:(NSString *)name contactType:(NSString *)contactType text:(NSString *)text {
  [_impl sendText:name contactType:contactType text:text];
}

- (void)sendAlert:(NSString *)name
      contactType:(NSString *)contactType
             text:(NSString *)text
            level:(NSString *)level {
  [_impl sendAlert:name contactType:contactType text:text level:level];
}

- (void)connectChannel:(NSString *)name {
  [_impl connectChannel:name];
}

- (void)disconnectChannel:(NSString *)name {
  [_impl disconnectChannel:name];
}

- (void)connectGroupConversation:(NSString *)name {
  [_impl connectGroupConversation:name];
}

- (void)disconnectGroupConversation:(NSString *)name {
  [_impl disconnectGroupConversation:name];
}

- (void)submitProblemReport {
  [_impl submitProblemReport];
}

- (void)muteContact:(NSString *)name contactType:(NSString *)contactType {
  [_impl muteContact:name contactType:contactType];
}

- (void)unmuteContact:(NSString *)name contactType:(NSString *)contactType {
  [_impl unmuteContact:name contactType:contactType];
}

- (void)startEmergency {
  [_impl startEmergency];
}

- (void)stopEmergency {
  [_impl stopEmergency];
}

- (void)getHistory:(NSString *)name
       contactType:(NSString *)contactType
       maxMessages:(double)maxMessages
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  [_impl getHistory:name
        contactType:contactType
        maxMessages:(NSInteger)maxMessages
            resolve:resolve
             reject:reject];
}

- (void)playHistoryMessage:(NSString *)historyId
               contactName:(NSString *)contactName
               contactType:(NSString *)contactType {
  [_impl playHistoryMessage:historyId contactName:contactName contactType:contactType];
}

- (void)stopHistoryMessagePlayback {
  [_impl stopHistoryMessagePlayback];
}

- (void)getHistoryImageData:(NSString *)historyId
                contactName:(NSString *)contactName
                contactType:(NSString *)contactType
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  [_impl getHistoryImageData:historyId
                 contactName:contactName
                 contactType:contactType
                     resolve:resolve
                      reject:reject];
}

- (void)endDispatchCall:(NSString *)channelName {
  [_impl endDispatchCall:channelName];
}

- (void)createGroupConversation:(NSArray *)usernames displayName:(NSString *)displayName {
  [_impl createGroupConversation:usernames displayName:displayName];
}

- (void)addUsersToGroupConversation:(NSString *)conversationName usernames:(NSArray *)usernames {
  [_impl addUsersToGroupConversation:conversationName usernames:usernames];
}

- (void)leaveGroupConversation:(NSString *)conversationName {
  [_impl leaveGroupConversation:conversationName];
}

- (void)renameGroupConversation:(NSString *)conversationName newName:(NSString *)newName {
  [_impl renameGroupConversation:conversationName newName:newName];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeZelloSdkSpecJSI>(params);
}

#endif

@end
