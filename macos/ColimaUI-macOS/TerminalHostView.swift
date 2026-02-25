import Cocoa
import SwiftTerm

/// Native macOS view that wraps SwiftTerm's LocalProcessTerminalView
/// for embedding in React Native via TerminalHostViewManager.
@objc(TerminalHostView)
class TerminalHostView: NSView, LocalProcessTerminalViewDelegate {

  private var terminalView: LocalProcessTerminalView?
  private var currentProcess: Process?

  // -- Props from React Native --
  @objc var containerId: NSString = "" {
    didSet { restartIfNeeded() }
  }

  @objc var containerName: NSString = "" {
    didSet { restartIfNeeded() }
  }

  @objc var fontSize: CGFloat = 13 {
    didSet {
      if let tv = terminalView {
        tv.font = NSFont.monospacedSystemFont(ofSize: fontSize, weight: .regular)
      }
    }
  }

  @objc var fontFamily: NSString = "Menlo" {
    didSet { updateFont() }
  }

  @objc var themeForeground: NSString = "#e8e2d6" {
    didSet { updateColors() }
  }

  @objc var themeBackground: NSString = "#1a1714" {
    didSet { updateColors() }
  }

  // -- Lifecycle --

  override init(frame: CGRect) {
    super.init(frame: frame)
    setupTerminal()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupTerminal()
  }

  deinit {
    currentProcess?.terminate()
  }

  private func setupTerminal() {
    let tv = LocalProcessTerminalView(frame: bounds)
    tv.processDelegate = self
    tv.autoresizingMask = [.width, .height]
    tv.font = NSFont.monospacedSystemFont(ofSize: fontSize, weight: .regular)

    addSubview(tv)
    terminalView = tv
    updateColors()
  }

  override func layout() {
    super.layout()
    terminalView?.frame = bounds
  }

  // -- Terminal colors --

  private func updateFont() {
    guard let tv = terminalView else { return }
    if let font = NSFont(name: fontFamily as String, size: fontSize) {
      tv.font = font
    } else {
      tv.font = NSFont.monospacedSystemFont(ofSize: fontSize, weight: .regular)
    }
  }

  private func updateColors() {
    guard let tv = terminalView else { return }
    if let fg = NSColor.fromHex(themeForeground as String),
       let bg = NSColor.fromHex(themeBackground as String) {
      tv.nativeForegroundColor = fg
      tv.nativeBackgroundColor = bg
    }
    tv.needsDisplay = true
  }

  // -- Process management --

  private var hasStarted = false

  private func restartIfNeeded() {
    guard !hasStarted, containerId.length > 0 else { return }
    hasStarted = true

    // Find the docker/colima CLI
    let dockerPath = findExecutable("docker")

    if let path = dockerPath {
      terminalView?.startProcess(
        executable: path,
        args: ["exec", "-it", containerId as String, "/bin/sh"],
        environment: defaultEnv(),
        execName: "docker"
      )
    } else {
      // Fallback: launch a local shell and print an error
      let shell = ProcessInfo.processInfo.environment["SHELL"] ?? "/bin/zsh"
      terminalView?.startProcess(
        executable: shell,
        args: [],
        environment: defaultEnv(),
        execName: "shell"
      )
      terminalView?.feed(text: "Error: 'docker' not found in PATH. Is Colima running?\r\n")
    }
  }

  private func findExecutable(_ name: String) -> String? {
    let paths = [
      "/usr/local/bin/\(name)",
      "/opt/homebrew/bin/\(name)",
      "/usr/bin/\(name)",
    ]
    for p in paths {
      if FileManager.default.isExecutableFile(atPath: p) {
        return p
      }
    }
    return nil
  }

  private func defaultEnv() -> [String] {
    var env = ProcessInfo.processInfo.environment
    env["TERM"] = "xterm-256color"
    env["LANG"] = "en_US.UTF-8"
    // Ensure Colima docker context if DOCKER_HOST not set
    if env["DOCKER_HOST"] == nil {
      let home = NSHomeDirectory()
      let colimaSocket = "\(home)/.colima/default/docker.sock"
      if FileManager.default.fileExists(atPath: colimaSocket) {
        env["DOCKER_HOST"] = "unix://\(colimaSocket)"
      }
    }
    return env.map { "\($0.key)=\($0.value)" }
  }

  // -- LocalProcessTerminalViewDelegate --

  func sizeChanged(source: LocalProcessTerminalView, newCols: Int, newRows: Int) {
    // Terminal resize handled internally by LocalProcessTerminalView
  }

  func processTerminated(source: TerminalView, exitCode: Int32?) {
    let code = exitCode.map { String($0) } ?? "unknown"
    DispatchQueue.main.async { [weak self] in
      self?.terminalView?.feed(text: "\r\n[Process exited with code \(code)]\r\n")
    }
  }

  func setTerminalTitle(source: LocalProcessTerminalView, title: String) {
    // Could emit event to JS if needed
  }

  func hostCurrentDirectoryUpdate(source: TerminalView, directory: String?) {
    // no-op
  }
}

// -- Color helper --

extension NSColor {
  static func fromHex(_ hex: String) -> NSColor? {
    var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if s.hasPrefix("#") { s.removeFirst() }
    guard s.count == 6 else { return nil }
    var rgb: UInt64 = 0
    Scanner(string: s).scanHexInt64(&rgb)
    return NSColor(
      red: CGFloat((rgb >> 16) & 0xFF) / 255.0,
      green: CGFloat((rgb >> 8) & 0xFF) / 255.0,
      blue: CGFloat(rgb & 0xFF) / 255.0,
      alpha: 1.0
    )
  }
}
