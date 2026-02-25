export type ContainerState =
  | 'running'
  | 'exited'
  | 'paused'
  | 'restarting'
  | 'removing'
  | 'dead'
  | 'created';

export interface ContainerPort {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: 'tcp' | 'udp';
}

export interface ContainerMount {
  Type: 'bind' | 'volume' | 'tmpfs';
  Name?: string;
  Source: string;
  Destination: string;
  Mode: string;
  RW: boolean;
}

export interface Container {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  State: ContainerState;
  Status: string;
  Ports: ContainerPort[];
  Labels: Record<string, string>;
  Mounts: ContainerMount[];
  NetworkSettings: {
    Networks: Record<
      string,
      {
        IPAddress: string;
        Gateway: string;
        MacAddress: string;
      }
    >;
  };
}

export interface ContainerInspect extends Container {
  Config: {
    Env: string[];
    Cmd: string[];
    Image: string;
    WorkingDir: string;
    Entrypoint: string[];
    ExposedPorts: Record<string, object>;
  };
  HostConfig: {
    Memory: number;
    CpuShares: number;
    RestartPolicy: {
      Name: string;
      MaximumRetryCount: number;
    };
  };
}

export interface DockerImage {
  Id: string;
  RepoTags: string[];
  RepoDigests: string[];
  Created: number;
  Size: number;
  SharedSize: number;
  VirtualSize: number;
  Labels: Record<string, string>;
  Containers: number;
}

export interface DockerVolume {
  Name: string;
  Driver: string;
  Mountpoint: string;
  CreatedAt: string;
  Labels: Record<string, string>;
  Scope: string;
  Options: Record<string, string> | null;
  UsageData?: {
    Size: number;
    RefCount: number;
  };
}

export interface BuildCache {
  ID: string;
  Type: string;
  Description: string;
  Size: number;
  CreatedAt: string;
  LastUsedAt: string;
  InUse: boolean;
  Shared: boolean;
}

export interface SystemDiskUsage {
  Images: DockerImage[];
  Containers: Container[];
  Volumes: DockerVolume[];
  BuildCache: BuildCache[];
  LayersSize: number;
}

export interface ComposeProject {
  name: string;
  containers: Container[];
}

export type NavigationScreen =
  | 'containers'
  | 'images'
  | 'volumes'
  | 'cleanup';

export interface ContainerLogEntry {
  timestamp: string;
  stream: 'stdout' | 'stderr';
  message: string;
}
