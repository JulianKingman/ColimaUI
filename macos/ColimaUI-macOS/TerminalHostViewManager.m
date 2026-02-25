#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(TerminalHostViewManager, RCTViewManager)
  RCT_EXPORT_VIEW_PROPERTY(containerId, NSString)
  RCT_EXPORT_VIEW_PROPERTY(containerName, NSString)
  RCT_EXPORT_VIEW_PROPERTY(fontSize, CGFloat)
  RCT_EXPORT_VIEW_PROPERTY(fontFamily, NSString)
  RCT_EXPORT_VIEW_PROPERTY(themeForeground, NSString)
  RCT_EXPORT_VIEW_PROPERTY(themeBackground, NSString)
@end
