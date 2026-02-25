import Foundation

/// React Native view manager that vends TerminalHostView to JS.
@objc(TerminalHostViewManager)
class TerminalHostViewManager: RCTViewManager {

  override func view() -> NSView! {
    return TerminalHostView(frame: .zero)
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
