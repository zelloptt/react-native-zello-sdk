#import "ZelloiOSSdkModuleBridge.h"

@interface RCT_EXTERN_MODULE(ZelloIOSSdkModule, NSObject)

RCT_EXTERN_METHOD(configure:(BOOL)isDebugBuild appGroup:(NSString *)appGroup)

RCT_EXTERN_METHOD(connect:(NSString *)network username:(NSString *)username password:(NSString *)password)
RCT_EXTERN_METHOD(disconnect)

RCT_EXTERN_METHOD(setAccountStatus:(NSString *)status)

RCT_EXTERN_METHOD(selectContact:(NSString *)name contactType:(NSString *)contactType)

RCT_EXTERN_METHOD(startVoiceMessage:(NSString *)name contactType:(NSString *)contactType)
RCT_EXTERN_METHOD(stopVoiceMessage)

RCT_EXTERN_METHOD(sendImage:(NSString *)name contactType:(NSString *)contactType data:(NSArray)data)

RCT_EXTERN_METHOD(sendLocation:(NSString *)name contactType:(NSString *)contactType)

RCT_EXTERN_METHOD(sendText:(NSString *)name contactType:(NSString *)contactType text:(NSString *)text)

RCT_EXTERN_METHOD(sendAlert:(NSString *)name contactType:(NSString *)contactType text:(NSString *)text level:(NSString *)level)

RCT_EXTERN_METHOD(connectChannel:(NSString *)name)
RCT_EXTERN_METHOD(disconnectChannel:(NSString *)name)

RCT_EXTERN_METHOD(connectGroupConversation:(NSString *)name)
RCT_EXTERN_METHOD(disconnectGroupConversation:(NSString *)name)

RCT_EXTERN_METHOD(submitProblemReport)

RCT_EXTERN_METHOD(muteContact:(NSString *)name contactType:(NSString *)contactType)
RCT_EXTERN_METHOD(unmuteContact:(NSString *)name contactType:(NSString *)contactType)

RCT_EXTERN_METHOD(startEmergency)
RCT_EXTERN_METHOD(stopEmergency)

RCT_EXTERN_METHOD(getHistory:(NSString *)name contactType:(NSString *)contactType maxMessages:(NSInteger)maxMessages callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(playHistoryMessage:(NSString *)historyId contactName:(NSString *)contactName contactType:(NSString *)contactType)

RCT_EXTERN_METHOD(stopHistoryMessagePlayback)

RCT_EXTERN_METHOD(getHistoryImageData:(NSString *)historyId contactName:(NSString *)contactName contactType:(NSString *)contactType callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(endDispatchCall:(NSString *)channelName)

RCT_EXTERN_METHOD(createGroupConversation:(NSArray *)usernames displayName:(NSString *)displayName)

RCT_EXTERN_METHOD(addUsersToGroupConversation:(NSString *)conversationName usernames:(NSArray *)usernames)

RCT_EXTERN_METHOD(leaveGroupConversation:(NSString *)conversationName)

RCT_EXTERN_METHOD(renameGroupConversation:(NSString *)conversationName newName:(NSString *)newName)

@end
