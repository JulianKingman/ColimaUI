import { NativeModules } from 'react-native';
import type {
  Container,
  ContainerInspect,
  ContainerLogEntry,
  DockerImage,
  DockerVolume,
  BuildCache,
  SystemDiskUsage,
} from '../types/docker';

const { DockerBridge } = NativeModules;

class DockerService {
  async ping(): Promise<{ connected: boolean; socketPath: string }> {
    const result = await DockerBridge.ping();
    return {
      connected: result.status === 'ok',
      socketPath: DockerBridge.socketPath ?? '',
    };
  }

  async listContainers(): Promise<Container[]> {
    const raw: any[] = await DockerBridge.listContainers(true);
    return raw.map(normalizeContainer);
  }

  async inspectContainer(id: string): Promise<ContainerInspect | null> {
    const raw: any = await DockerBridge.inspectContainer(id);
    return normalizeContainerInspect(raw);
  }

  async startContainer(id: string): Promise<boolean> {
    await DockerBridge.startContainer(id);
    return true;
  }

  async stopContainer(id: string): Promise<boolean> {
    await DockerBridge.stopContainer(id);
    return true;
  }

  async restartContainer(id: string): Promise<boolean> {
    await DockerBridge.restartContainer(id);
    return true;
  }

  async removeContainer(id: string): Promise<boolean> {
    await DockerBridge.removeContainer(id, false);
    return true;
  }

  async getContainerLogs(id: string): Promise<ContainerLogEntry[]> {
    return await DockerBridge.getContainerLogs(id, 200);
  }

  async listImages(): Promise<DockerImage[]> {
    const raw: any[] = await DockerBridge.listImages();
    return raw.map(normalizeImage);
  }

  async removeImage(id: string): Promise<boolean> {
    await DockerBridge.removeImage(id, false);
    return true;
  }

  async listVolumes(): Promise<DockerVolume[]> {
    const raw: any = await DockerBridge.listVolumes();
    return (raw.Volumes ?? []).map(normalizeVolume);
  }

  async removeVolume(name: string): Promise<boolean> {
    await DockerBridge.removeVolume(name, false);
    return true;
  }

  async getSystemDiskUsage(): Promise<SystemDiskUsage> {
    const raw: any = await DockerBridge.getSystemDiskUsage();
    return {
      Images: (raw.Images ?? []).map(normalizeImage),
      Containers: (raw.Containers ?? []).map(normalizeContainer),
      Volumes: (raw.Volumes ?? []).map(normalizeVolume),
      BuildCache: (raw.BuildCache ?? []).map(normalizeBuildCache),
      LayersSize: raw.LayersSize ?? 0,
    };
  }

  async pruneContainers(): Promise<{ count: number; spaceReclaimed: number }> {
    const r: any = await DockerBridge.pruneContainers();
    return {
      count: r.ContainersDeleted?.length ?? 0,
      spaceReclaimed: r.SpaceReclaimed ?? 0,
    };
  }

  async pruneImages(): Promise<{ count: number; spaceReclaimed: number }> {
    const r: any = await DockerBridge.pruneImages();
    return {
      count: r.ImagesDeleted?.length ?? 0,
      spaceReclaimed: r.SpaceReclaimed ?? 0,
    };
  }

  async pruneVolumes(): Promise<{ count: number; spaceReclaimed: number }> {
    const r: any = await DockerBridge.pruneVolumes();
    return {
      count: r.VolumesDeleted?.length ?? 0,
      spaceReclaimed: r.SpaceReclaimed ?? 0,
    };
  }

  async pruneBuildCache(): Promise<{ count: number; spaceReclaimed: number }> {
    const r: any = await DockerBridge.pruneBuildCache();
    return {
      count: r.CachesDeleted?.length ?? 0,
      spaceReclaimed: r.SpaceReclaimed ?? 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Normalization — Docker Engine API JSON → app types
// ---------------------------------------------------------------------------

function normalizeContainer(raw: any): Container {
  return {
    Id: raw.Id ?? '',
    Names: raw.Names ?? [],
    Image: raw.Image ?? '',
    ImageID: raw.ImageID ?? '',
    Command: raw.Command ?? '',
    Created: raw.Created ?? 0,
    State: (raw.State ?? 'created').toLowerCase(),
    Status: raw.Status ?? '',
    Ports: (raw.Ports ?? []).map((p: any) => ({
      IP: p.IP,
      PrivatePort: p.PrivatePort ?? 0,
      PublicPort: p.PublicPort,
      Type: p.Type ?? 'tcp',
    })),
    Labels: raw.Labels ?? {},
    Mounts: (raw.Mounts ?? []).map((m: any) => ({
      Type: m.Type ?? 'volume',
      Name: m.Name,
      Source: m.Source ?? '',
      Destination: m.Destination ?? '',
      Mode: m.Mode ?? '',
      RW: m.RW ?? true,
    })),
    NetworkSettings: {
      Networks: Object.fromEntries(
        Object.entries(raw.NetworkSettings?.Networks ?? {}).map(([k, v]: [string, any]) => [
          k,
          {
            IPAddress: v?.IPAddress ?? '',
            Gateway: v?.Gateway ?? '',
            MacAddress: v?.MacAddress ?? '',
          },
        ]),
      ),
    },
  };
}

function normalizeContainerInspect(raw: any): ContainerInspect {
  const base = normalizeContainer(raw);
  return {
    ...base,
    State: (typeof raw.State === 'object' ? raw.State?.Status : raw.State ?? 'created').toLowerCase(),
    Status: typeof raw.State === 'object' ? raw.State?.Status ?? '' : raw.Status ?? '',
    Config: {
      Env: raw.Config?.Env ?? [],
      Cmd: raw.Config?.Cmd ?? [],
      Image: raw.Config?.Image ?? '',
      WorkingDir: raw.Config?.WorkingDir ?? '',
      Entrypoint: raw.Config?.Entrypoint ?? [],
      ExposedPorts: raw.Config?.ExposedPorts ?? {},
    },
    HostConfig: {
      Memory: raw.HostConfig?.Memory ?? 0,
      CpuShares: raw.HostConfig?.CpuShares ?? 0,
      RestartPolicy: {
        Name: raw.HostConfig?.RestartPolicy?.Name ?? '',
        MaximumRetryCount: raw.HostConfig?.RestartPolicy?.MaximumRetryCount ?? 0,
      },
    },
  };
}

function normalizeImage(raw: any): DockerImage {
  return {
    Id: raw.Id ?? '',
    RepoTags: raw.RepoTags ?? [],
    RepoDigests: raw.RepoDigests ?? [],
    Created: raw.Created ?? 0,
    Size: raw.Size ?? 0,
    SharedSize: raw.SharedSize ?? 0,
    VirtualSize: raw.VirtualSize ?? raw.Size ?? 0,
    Labels: raw.Labels ?? {},
    Containers: raw.Containers ?? 0,
  };
}

function normalizeVolume(raw: any): DockerVolume {
  return {
    Name: raw.Name ?? '',
    Driver: raw.Driver ?? 'local',
    Mountpoint: raw.Mountpoint ?? '',
    CreatedAt: raw.CreatedAt ?? '',
    Labels: raw.Labels ?? {},
    Scope: raw.Scope ?? 'local',
    Options: raw.Options ?? null,
    UsageData: raw.UsageData
      ? { Size: raw.UsageData.Size ?? 0, RefCount: raw.UsageData.RefCount ?? 0 }
      : undefined,
  };
}

function normalizeBuildCache(raw: any): BuildCache {
  return {
    ID: raw.ID ?? '',
    Type: raw.Type ?? '',
    Description: raw.Description ?? '',
    Size: raw.Size ?? 0,
    CreatedAt: raw.CreatedAt ?? '',
    LastUsedAt: raw.LastUsedAt ?? '',
    InUse: raw.InUse ?? false,
    Shared: raw.Shared ?? false,
  };
}

export const dockerService = new DockerService();
