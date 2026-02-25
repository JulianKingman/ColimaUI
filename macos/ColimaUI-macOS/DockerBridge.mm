#import "DockerBridge.h"
#import <React/RCTLog.h>
#import <sys/socket.h>
#import <sys/un.h>
#import <unistd.h>

// ---------------------------------------------------------------------------
// Helpers: HTTP over Unix domain socket
// ---------------------------------------------------------------------------

static NSString *defaultSocketPath(void) {
  NSString *home = NSHomeDirectory();
  // Try Colima default socket first, then Docker Desktop fallback
  NSArray<NSString *> *candidates = @[
    [home stringByAppendingPathComponent:@".colima/default/docker.sock"],
    [home stringByAppendingPathComponent:@".colima/docker.sock"],
    @"/var/run/docker.sock",
  ];
  for (NSString *path in candidates) {
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
      return path;
    }
  }
  return candidates.firstObject; // fallback even if missing
}

static int connectToSocket(NSString *path) {
  int fd = socket(AF_UNIX, SOCK_STREAM, 0);
  if (fd < 0) return -1;

  struct sockaddr_un addr;
  memset(&addr, 0, sizeof(addr));
  addr.sun_family = AF_UNIX;
  strlcpy(addr.sun_path, [path UTF8String], sizeof(addr.sun_path));

  if (connect(fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
    close(fd);
    return -1;
  }
  return fd;
}

static NSData *decodeChunked(NSData *data);

static NSData *sendHTTPRequest(NSString *socketPath, NSString *method, NSString *urlPath, NSData *body) {
  int fd = connectToSocket(socketPath);
  if (fd < 0) return nil;

  // Build HTTP/1.1 request
  NSMutableString *request = [NSMutableString stringWithFormat:@"%@ %@ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n", method, urlPath];

  if (body.length > 0) {
    [request appendFormat:@"Content-Type: application/json\r\nContent-Length: %lu\r\n", (unsigned long)body.length];
  }
  [request appendString:@"\r\n"];

  NSMutableData *requestData = [[request dataUsingEncoding:NSUTF8StringEncoding] mutableCopy];
  if (body.length > 0) {
    [requestData appendData:body];
  }

  // Send
  const uint8_t *bytes = (const uint8_t *)requestData.bytes;
  NSUInteger remaining = requestData.length;
  while (remaining > 0) {
    ssize_t written = write(fd, bytes + (requestData.length - remaining), remaining);
    if (written <= 0) { close(fd); return nil; }
    remaining -= written;
  }

  // Read response
  NSMutableData *response = [NSMutableData data];
  uint8_t buf[8192];
  ssize_t n;
  while ((n = read(fd, buf, sizeof(buf))) > 0) {
    [response appendBytes:buf length:n];
  }
  close(fd);

  // Strip HTTP headers — find \r\n\r\n
  NSRange headerEnd = [response rangeOfData:[@"\r\n\r\n" dataUsingEncoding:NSUTF8StringEncoding]
                                    options:0
                                      range:NSMakeRange(0, response.length)];
  if (headerEnd.location == NSNotFound) return response;

  // Check for chunked transfer encoding
  NSString *headerStr = [[NSString alloc] initWithData:[response subdataWithRange:NSMakeRange(0, headerEnd.location)]
                                              encoding:NSUTF8StringEncoding];
  NSUInteger bodyStart = headerEnd.location + 4;
  NSData *bodyData = [response subdataWithRange:NSMakeRange(bodyStart, response.length - bodyStart)];

  if ([headerStr.lowercaseString containsString:@"transfer-encoding: chunked"]) {
    return decodeChunked(bodyData);
  }
  return bodyData;
}

static NSData *decodeChunked(NSData *data) {
  NSMutableData *decoded = [NSMutableData data];
  NSUInteger pos = 0;
  while (pos < data.length) {
    // Find chunk size line
    NSRange lineEnd = [data rangeOfData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]
                                options:0
                                  range:NSMakeRange(pos, data.length - pos)];
    if (lineEnd.location == NSNotFound) break;

    NSString *sizeStr = [[NSString alloc] initWithData:[data subdataWithRange:NSMakeRange(pos, lineEnd.location - pos)]
                                              encoding:NSUTF8StringEncoding];
    unsigned long chunkSize = strtoul([sizeStr UTF8String], NULL, 16);
    if (chunkSize == 0) break;

    NSUInteger chunkStart = lineEnd.location + 2;
    if (chunkStart + chunkSize > data.length) break;
    [decoded appendData:[data subdataWithRange:NSMakeRange(chunkStart, chunkSize)]];
    pos = chunkStart + chunkSize + 2; // skip trailing \r\n
  }
  return decoded;
}

// ---------------------------------------------------------------------------
// DockerBridge native module
// ---------------------------------------------------------------------------

@implementation DockerBridge {
  NSString *_socketPath;
}

RCT_EXPORT_MODULE();

- (instancetype)init {
  if (self = [super init]) {
    _socketPath = defaultSocketPath();
    RCTLogInfo(@"DockerBridge: NSHomeDirectory = %@", NSHomeDirectory());
    RCTLogInfo(@"DockerBridge: socket path = %@", _socketPath);
    RCTLogInfo(@"DockerBridge: socket exists = %d", [[NSFileManager defaultManager] fileExistsAtPath:_socketPath]);
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onContainerLog"];
}

- (NSDictionary *)constantsToExport {
  return @{@"socketPath": _socketPath ?: @""};
}

// -- Helpers --

- (void)dockerGET:(NSString *)path
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSData *data = sendHTTPRequest(self->_socketPath, @"GET", path, nil);
    if (!data) {
      reject(@"DOCKER_ERR", @"Failed to connect to Docker socket", nil);
      return;
    }
    NSError *err = nil;
    id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&err];
    if (err) {
      reject(@"DOCKER_PARSE", [NSString stringWithFormat:@"JSON parse error: %@", err.localizedDescription], err);
      return;
    }
    resolve(json);
  });
}

- (void)dockerPOST:(NSString *)path
              body:(NSDictionary *)bodyDict
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSData *bodyData = nil;
    if (bodyDict) {
      bodyData = [NSJSONSerialization dataWithJSONObject:bodyDict options:0 error:nil];
    }
    NSData *data = sendHTTPRequest(self->_socketPath, @"POST", path, bodyData);
    if (!data) {
      reject(@"DOCKER_ERR", @"Failed to connect to Docker socket", nil);
      return;
    }
    if (data.length == 0) {
      resolve(@{});
      return;
    }
    NSError *err = nil;
    id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&err];
    resolve(json ?: @{});
  });
}

- (void)dockerDELETE:(NSString *)path
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSData *data = sendHTTPRequest(self->_socketPath, @"DELETE", path, nil);
    if (!data) {
      reject(@"DOCKER_ERR", @"Failed to connect to Docker socket", nil);
      return;
    }
    if (data.length == 0) {
      resolve(@{});
      return;
    }
    NSError *err = nil;
    id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&err];
    resolve(json ?: @{});
  });
}

// ---------------------------------------------------------------------------
// Exported methods
// ---------------------------------------------------------------------------

RCT_EXPORT_METHOD(setSocketPath:(NSString *)path) {
  _socketPath = path;
}

RCT_EXPORT_METHOD(ping:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSData *data = sendHTTPRequest(self->_socketPath, @"GET", @"/_ping", nil);
    if (!data) {
      reject(@"DOCKER_ERR", @"Cannot reach Docker daemon", nil);
      return;
    }
    NSString *resp = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    resolve(@{@"status": [resp isEqualToString:@"OK"] ? @"ok" : @"error", @"response": resp ?: @""});
  });
}

RCT_EXPORT_METHOD(listContainers:(BOOL)all
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = all ? @"/containers/json?all=true" : @"/containers/json";
  [self dockerGET:path resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(inspectContainer:(NSString *)containerId
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = [NSString stringWithFormat:@"/containers/%@/json", containerId];
  [self dockerGET:path resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(startContainer:(NSString *)containerId
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = [NSString stringWithFormat:@"/containers/%@/start", containerId];
  [self dockerPOST:path body:nil resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(stopContainer:(NSString *)containerId
                        resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = [NSString stringWithFormat:@"/containers/%@/stop", containerId];
  [self dockerPOST:path body:nil resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(restartContainer:(NSString *)containerId
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = [NSString stringWithFormat:@"/containers/%@/restart", containerId];
  [self dockerPOST:path body:nil resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(removeContainer:(NSString *)containerId
                            force:(BOOL)force
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = [NSString stringWithFormat:@"/containers/%@?force=%@", containerId, force ? @"true" : @"false"];
  [self dockerDELETE:path resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(getContainerLogs:(NSString *)containerId
                             tail:(NSInteger)tail
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = [NSString stringWithFormat:@"/containers/%@/logs?stdout=true&stderr=true&timestamps=true&tail=%ld",
                    containerId, (long)(tail > 0 ? tail : 200)];
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSData *data = sendHTTPRequest(self->_socketPath, @"GET", path, nil);
    if (!data) {
      reject(@"DOCKER_ERR", @"Failed to get container logs", nil);
      return;
    }
    // Docker multiplexed stream: each frame has 8-byte header
    // [stream_type(1) padding(3) size(4)] [payload(size)]
    NSMutableArray *entries = [NSMutableArray array];
    NSUInteger pos = 0;
    while (pos + 8 <= data.length) {
      uint8_t streamType = ((const uint8_t *)data.bytes)[pos];
      uint32_t frameSize = 0;
      [data getBytes:&frameSize range:NSMakeRange(pos + 4, 4)];
      frameSize = CFSwapInt32BigToHost(frameSize);

      pos += 8;
      if (pos + frameSize > data.length) break;

      NSString *line = [[NSString alloc] initWithData:[data subdataWithRange:NSMakeRange(pos, frameSize)]
                                             encoding:NSUTF8StringEncoding];
      pos += frameSize;
      if (!line) continue;

      // Parse timestamp from front: 2024-01-01T00:00:00.000000000Z message
      NSString *timestamp = @"";
      NSString *message = line;
      if (line.length > 30 && [line characterAtIndex:4] == '-') {
        NSRange spaceRange = [line rangeOfString:@" "];
        if (spaceRange.location != NSNotFound && spaceRange.location < 40) {
          timestamp = [line substringToIndex:spaceRange.location];
          message = [line substringFromIndex:spaceRange.location + 1];
        }
      }
      // Trim trailing newline
      message = [message stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]];

      [entries addObject:@{
        @"timestamp": timestamp,
        @"stream": streamType == 2 ? @"stderr" : @"stdout",
        @"message": message,
      }];
    }
    resolve(entries);
  });
}

RCT_EXPORT_METHOD(listImages:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  [self dockerGET:@"/images/json?all=false" resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(removeImage:(NSString *)imageId
                        force:(BOOL)force
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = [NSString stringWithFormat:@"/images/%@?force=%@", imageId, force ? @"true" : @"false"];
  [self dockerDELETE:path resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(listVolumes:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  [self dockerGET:@"/volumes" resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(removeVolume:(NSString *)name
                         force:(BOOL)force
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject) {
  NSString *path = [NSString stringWithFormat:@"/volumes/%@?force=%@", name, force ? @"true" : @"false"];
  [self dockerDELETE:path resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(getSystemDiskUsage:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  [self dockerGET:@"/system/df" resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(pruneContainers:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  [self dockerPOST:@"/containers/prune" body:nil resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(pruneImages:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  [self dockerPOST:@"/images/prune" body:nil resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(pruneVolumes:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  [self dockerPOST:@"/volumes/prune" body:nil resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(pruneBuildCache:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  [self dockerPOST:@"/build/prune" body:nil resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(runCommand:(NSString *)command
                         args:(NSArray<NSString *> *)args
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    @try {
      NSTask *task = [[NSTask alloc] init];
      task.executableURL = [NSURL fileURLWithPath:command];
      task.arguments = args ?: @[];

      NSPipe *stdoutPipe = [NSPipe pipe];
      NSPipe *stderrPipe = [NSPipe pipe];
      task.standardOutput = stdoutPipe;
      task.standardError = stderrPipe;

      NSError *launchError = nil;
      [task launchAndReturnError:&launchError];
      if (launchError) {
        reject(@"LAUNCH_ERR", launchError.localizedDescription, launchError);
        return;
      }
      [task waitUntilExit];

      NSData *stdoutData = [stdoutPipe.fileHandleForReading readDataToEndOfFile];
      NSData *stderrData = [stderrPipe.fileHandleForReading readDataToEndOfFile];
      NSString *stdoutStr = [[NSString alloc] initWithData:stdoutData encoding:NSUTF8StringEncoding] ?: @"";
      NSString *stderrStr = [[NSString alloc] initWithData:stderrData encoding:NSUTF8StringEncoding] ?: @"";

      resolve(@{
        @"exitCode": @(task.terminationStatus),
        @"stdout": stdoutStr,
        @"stderr": stderrStr,
      });
    } @catch (NSException *exception) {
      reject(@"TASK_ERR", exception.reason ?: @"Failed to run command", nil);
    }
  });
}

@end
