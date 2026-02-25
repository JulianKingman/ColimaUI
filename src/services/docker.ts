import type {
  Container,
  ContainerInspect,
  ContainerLogEntry,
  DockerImage,
  DockerVolume,
  BuildCache,
  SystemDiskUsage,
} from '../types/docker';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const now = Math.floor(Date.now() / 1000);
const hour = 3600;
const day = 86400;

const mockContainers: Container[] = [
  // ---- Project: myapp ----
  {
    Id: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    Names: ['/myapp-web-1'],
    Image: 'myapp-web:latest',
    ImageID: 'sha256:abc123def456',
    Command: 'node server.js',
    Created: now - 2 * day,
    State: 'running',
    Status: 'Up 2 days',
    Ports: [
      { PrivatePort: 3000, PublicPort: 3000, Type: 'tcp', IP: '0.0.0.0' },
    ],
    Labels: {
      'com.docker.compose.project': 'myapp',
      'com.docker.compose.service': 'web',
      'com.docker.compose.container-number': '1',
    },
    Mounts: [
      {
        Type: 'bind',
        Source: '/Users/dev/myapp/src',
        Destination: '/app/src',
        Mode: 'rw',
        RW: true,
      },
    ],
    NetworkSettings: {
      Networks: {
        myapp_default: {
          IPAddress: '172.18.0.3',
          Gateway: '172.18.0.1',
          MacAddress: '02:42:ac:12:00:03',
        },
      },
    },
  },
  {
    Id: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    Names: ['/myapp-api-1'],
    Image: 'myapp-api:latest',
    ImageID: 'sha256:def456abc789',
    Command: 'python manage.py runserver 0.0.0.0:8000',
    Created: now - 2 * day,
    State: 'running',
    Status: 'Up 2 days',
    Ports: [
      { PrivatePort: 8000, PublicPort: 8000, Type: 'tcp', IP: '0.0.0.0' },
    ],
    Labels: {
      'com.docker.compose.project': 'myapp',
      'com.docker.compose.service': 'api',
      'com.docker.compose.container-number': '1',
    },
    Mounts: [],
    NetworkSettings: {
      Networks: {
        myapp_default: {
          IPAddress: '172.18.0.4',
          Gateway: '172.18.0.1',
          MacAddress: '02:42:ac:12:00:04',
        },
      },
    },
  },
  {
    Id: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    Names: ['/myapp-db-1'],
    Image: 'postgres:16-alpine',
    ImageID: 'sha256:789abc123def',
    Command: 'docker-entrypoint.sh postgres',
    Created: now - 2 * day,
    State: 'running',
    Status: 'Up 2 days',
    Ports: [
      { PrivatePort: 5432, PublicPort: 5432, Type: 'tcp', IP: '0.0.0.0' },
    ],
    Labels: {
      'com.docker.compose.project': 'myapp',
      'com.docker.compose.service': 'db',
      'com.docker.compose.container-number': '1',
    },
    Mounts: [
      {
        Type: 'volume',
        Name: 'myapp_pgdata',
        Source: '/var/lib/docker/volumes/myapp_pgdata/_data',
        Destination: '/var/lib/postgresql/data',
        Mode: 'rw',
        RW: true,
      },
    ],
    NetworkSettings: {
      Networks: {
        myapp_default: {
          IPAddress: '172.18.0.2',
          Gateway: '172.18.0.1',
          MacAddress: '02:42:ac:12:00:02',
        },
      },
    },
  },
  {
    Id: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    Names: ['/myapp-redis-1'],
    Image: 'redis:7-alpine',
    ImageID: 'sha256:aabbccddee11',
    Command: 'redis-server --appendonly yes',
    Created: now - 2 * day,
    State: 'running',
    Status: 'Up 2 days',
    Ports: [{ PrivatePort: 6379, PublicPort: 6379, Type: 'tcp', IP: '0.0.0.0' }],
    Labels: {
      'com.docker.compose.project': 'myapp',
      'com.docker.compose.service': 'redis',
      'com.docker.compose.container-number': '1',
    },
    Mounts: [],
    NetworkSettings: {
      Networks: {
        myapp_default: {
          IPAddress: '172.18.0.5',
          Gateway: '172.18.0.1',
          MacAddress: '02:42:ac:12:00:05',
        },
      },
    },
  },
  // ---- Project: blog ----
  {
    Id: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    Names: ['/blog-wordpress-1'],
    Image: 'wordpress:6.4-apache',
    ImageID: 'sha256:112233445566',
    Command: 'docker-entrypoint.sh apache2-foreground',
    Created: now - 5 * day,
    State: 'exited',
    Status: 'Exited (0) 3 hours ago',
    Ports: [],
    Labels: {
      'com.docker.compose.project': 'blog',
      'com.docker.compose.service': 'wordpress',
      'com.docker.compose.container-number': '1',
    },
    Mounts: [
      {
        Type: 'volume',
        Name: 'blog_wp_data',
        Source: '/var/lib/docker/volumes/blog_wp_data/_data',
        Destination: '/var/www/html',
        Mode: 'rw',
        RW: true,
      },
    ],
    NetworkSettings: {
      Networks: {
        blog_default: {
          IPAddress: '',
          Gateway: '',
          MacAddress: '',
        },
      },
    },
  },
  {
    Id: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    Names: ['/blog-mysql-1'],
    Image: 'mysql:8.0',
    ImageID: 'sha256:aabbcc112233',
    Command: 'docker-entrypoint.sh mysqld',
    Created: now - 5 * day,
    State: 'exited',
    Status: 'Exited (0) 3 hours ago',
    Ports: [],
    Labels: {
      'com.docker.compose.project': 'blog',
      'com.docker.compose.service': 'mysql',
      'com.docker.compose.container-number': '1',
    },
    Mounts: [
      {
        Type: 'volume',
        Name: 'blog_db_data',
        Source: '/var/lib/docker/volumes/blog_db_data/_data',
        Destination: '/var/lib/mysql',
        Mode: 'rw',
        RW: true,
      },
    ],
    NetworkSettings: {
      Networks: {
        blog_default: {
          IPAddress: '',
          Gateway: '',
          MacAddress: '',
        },
      },
    },
  },
  // ---- Standalone containers ----
  {
    Id: 'a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8',
    Names: ['/nginx-proxy'],
    Image: 'nginx:alpine',
    ImageID: 'sha256:445566778899',
    Command: 'nginx -g "daemon off;"',
    Created: now - 10 * day,
    State: 'running',
    Status: 'Up 10 days',
    Ports: [
      { PrivatePort: 80, PublicPort: 80, Type: 'tcp', IP: '0.0.0.0' },
      { PrivatePort: 443, PublicPort: 443, Type: 'tcp', IP: '0.0.0.0' },
    ],
    Labels: {},
    Mounts: [
      {
        Type: 'bind',
        Source: '/etc/nginx/conf.d',
        Destination: '/etc/nginx/conf.d',
        Mode: 'ro',
        RW: false,
      },
    ],
    NetworkSettings: {
      Networks: {
        bridge: {
          IPAddress: '172.17.0.2',
          Gateway: '172.17.0.1',
          MacAddress: '02:42:ac:11:00:02',
        },
      },
    },
  },
  {
    Id: 'b8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1f2a3b8c9',
    Names: ['/portainer'],
    Image: 'portainer/portainer-ce:latest',
    ImageID: 'sha256:998877665544',
    Command: '/portainer',
    Created: now - 30 * day,
    State: 'running',
    Status: 'Up 30 days',
    Ports: [
      { PrivatePort: 9443, PublicPort: 9443, Type: 'tcp', IP: '0.0.0.0' },
    ],
    Labels: {},
    Mounts: [
      {
        Type: 'volume',
        Name: 'portainer_data',
        Source: '/var/lib/docker/volumes/portainer_data/_data',
        Destination: '/data',
        Mode: 'rw',
        RW: true,
      },
    ],
    NetworkSettings: {
      Networks: {
        bridge: {
          IPAddress: '172.17.0.3',
          Gateway: '172.17.0.1',
          MacAddress: '02:42:ac:11:00:03',
        },
      },
    },
  },
  {
    Id: 'deadbeef1234deadbeef1234deadbeef1234deadbeef1234deadbeef1234deadbeef',
    Names: ['/test-runner'],
    Image: 'node:20-slim',
    ImageID: 'sha256:deadbeef1234',
    Command: 'npm test',
    Created: now - 1 * hour,
    State: 'exited',
    Status: 'Exited (1) 45 minutes ago',
    Ports: [],
    Labels: {},
    Mounts: [],
    NetworkSettings: {
      Networks: {
        bridge: {
          IPAddress: '',
          Gateway: '',
          MacAddress: '',
        },
      },
    },
  },
];

const mockImages: DockerImage[] = [
  {
    Id: 'sha256:abc123def456abc123def456abc123def456abc123def456abc123def456abc123',
    RepoTags: ['myapp-web:latest'],
    RepoDigests: [],
    Created: now - 2 * day,
    Size: 287_000_000,
    SharedSize: 120_000_000,
    VirtualSize: 287_000_000,
    Labels: {},
    Containers: 1,
  },
  {
    Id: 'sha256:def456abc789def456abc789def456abc789def456abc789def456abc789def456',
    RepoTags: ['myapp-api:latest'],
    RepoDigests: [],
    Created: now - 2 * day,
    Size: 412_000_000,
    SharedSize: 180_000_000,
    VirtualSize: 412_000_000,
    Labels: {},
    Containers: 1,
  },
  {
    Id: 'sha256:789abc123def789abc123def789abc123def789abc123def789abc123def789abc',
    RepoTags: ['postgres:16-alpine'],
    RepoDigests: ['postgres@sha256:aabbcc'],
    Created: now - 14 * day,
    Size: 233_000_000,
    SharedSize: 80_000_000,
    VirtualSize: 233_000_000,
    Labels: {},
    Containers: 1,
  },
  {
    Id: 'sha256:aabbccddee11aabbccddee11aabbccddee11aabbccddee11aabbccddee11aabb',
    RepoTags: ['redis:7-alpine'],
    RepoDigests: ['redis@sha256:ddeeff'],
    Created: now - 14 * day,
    Size: 30_000_000,
    SharedSize: 7_000_000,
    VirtualSize: 30_000_000,
    Labels: {},
    Containers: 1,
  },
  {
    Id: 'sha256:112233445566112233445566112233445566112233445566112233445566112233',
    RepoTags: ['wordpress:6.4-apache'],
    RepoDigests: ['wordpress@sha256:112233'],
    Created: now - 20 * day,
    Size: 615_000_000,
    SharedSize: 200_000_000,
    VirtualSize: 615_000_000,
    Labels: {},
    Containers: 1,
  },
  {
    Id: 'sha256:aabbcc112233aabbcc112233aabbcc112233aabbcc112233aabbcc112233aabbcc',
    RepoTags: ['mysql:8.0'],
    RepoDigests: ['mysql@sha256:445566'],
    Created: now - 20 * day,
    Size: 573_000_000,
    SharedSize: 180_000_000,
    VirtualSize: 573_000_000,
    Labels: {},
    Containers: 1,
  },
  {
    Id: 'sha256:445566778899445566778899445566778899445566778899445566778899445566',
    RepoTags: ['nginx:alpine'],
    RepoDigests: ['nginx@sha256:778899'],
    Created: now - 30 * day,
    Size: 42_000_000,
    SharedSize: 7_000_000,
    VirtualSize: 42_000_000,
    Labels: {},
    Containers: 1,
  },
  {
    Id: 'sha256:998877665544998877665544998877665544998877665544998877665544998877',
    RepoTags: ['portainer/portainer-ce:latest'],
    RepoDigests: ['portainer/portainer-ce@sha256:aabb'],
    Created: now - 60 * day,
    Size: 293_000_000,
    SharedSize: 50_000_000,
    VirtualSize: 293_000_000,
    Labels: {},
    Containers: 1,
  },
  {
    Id: 'sha256:deadbeef1234deadbeef1234deadbeef1234deadbeef1234deadbeef1234deadbe',
    RepoTags: ['node:20-slim'],
    RepoDigests: ['node@sha256:dead'],
    Created: now - 7 * day,
    Size: 240_000_000,
    SharedSize: 80_000_000,
    VirtualSize: 240_000_000,
    Labels: {},
    Containers: 1,
  },
  // Dangling images
  {
    Id: 'sha256:dangle1111111111111111111111111111111111111111111111111111111111',
    RepoTags: ['<none>:<none>'],
    RepoDigests: [],
    Created: now - 15 * day,
    Size: 350_000_000,
    SharedSize: 0,
    VirtualSize: 350_000_000,
    Labels: {},
    Containers: 0,
  },
  {
    Id: 'sha256:dangle2222222222222222222222222222222222222222222222222222222222',
    RepoTags: ['<none>:<none>'],
    RepoDigests: [],
    Created: now - 20 * day,
    Size: 180_000_000,
    SharedSize: 0,
    VirtualSize: 180_000_000,
    Labels: {},
    Containers: 0,
  },
];

const mockVolumes: DockerVolume[] = [
  {
    Name: 'myapp_pgdata',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/myapp_pgdata/_data',
    CreatedAt: new Date(Date.now() - 2 * day * 1000).toISOString(),
    Labels: { 'com.docker.compose.project': 'myapp' },
    Scope: 'local',
    Options: null,
    UsageData: { Size: 256_000_000, RefCount: 1 },
  },
  {
    Name: 'blog_wp_data',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/blog_wp_data/_data',
    CreatedAt: new Date(Date.now() - 5 * day * 1000).toISOString(),
    Labels: { 'com.docker.compose.project': 'blog' },
    Scope: 'local',
    Options: null,
    UsageData: { Size: 420_000_000, RefCount: 1 },
  },
  {
    Name: 'blog_db_data',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/blog_db_data/_data',
    CreatedAt: new Date(Date.now() - 5 * day * 1000).toISOString(),
    Labels: { 'com.docker.compose.project': 'blog' },
    Scope: 'local',
    Options: null,
    UsageData: { Size: 512_000_000, RefCount: 1 },
  },
  {
    Name: 'portainer_data',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/portainer_data/_data',
    CreatedAt: new Date(Date.now() - 30 * day * 1000).toISOString(),
    Labels: {},
    Scope: 'local',
    Options: null,
    UsageData: { Size: 45_000_000, RefCount: 1 },
  },
  // Unused volumes
  {
    Name: 'old_project_data',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/old_project_data/_data',
    CreatedAt: new Date(Date.now() - 90 * day * 1000).toISOString(),
    Labels: {},
    Scope: 'local',
    Options: null,
    UsageData: { Size: 1_200_000_000, RefCount: 0 },
  },
  {
    Name: 'temp_cache',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/temp_cache/_data',
    CreatedAt: new Date(Date.now() - 45 * day * 1000).toISOString(),
    Labels: {},
    Scope: 'local',
    Options: null,
    UsageData: { Size: 890_000_000, RefCount: 0 },
  },
];

const mockBuildCache: BuildCache[] = [
  {
    ID: 'bc-sha256:1111',
    Type: 'regular',
    Description: 'apt-get install build-essential',
    Size: 280_000_000,
    CreatedAt: new Date(Date.now() - 3 * day * 1000).toISOString(),
    LastUsedAt: new Date(Date.now() - 1 * day * 1000).toISOString(),
    InUse: false,
    Shared: true,
  },
  {
    ID: 'bc-sha256:2222',
    Type: 'regular',
    Description: 'npm install',
    Size: 450_000_000,
    CreatedAt: new Date(Date.now() - 5 * day * 1000).toISOString(),
    LastUsedAt: new Date(Date.now() - 2 * day * 1000).toISOString(),
    InUse: false,
    Shared: false,
  },
  {
    ID: 'bc-sha256:3333',
    Type: 'source.local',
    Description: 'local source for myapp',
    Size: 120_000_000,
    CreatedAt: new Date(Date.now() - 1 * day * 1000).toISOString(),
    LastUsedAt: new Date(Date.now() - 6 * hour * 1000).toISOString(),
    InUse: true,
    Shared: false,
  },
  {
    ID: 'bc-sha256:4444',
    Type: 'regular',
    Description: 'pip install -r requirements.txt',
    Size: 340_000_000,
    CreatedAt: new Date(Date.now() - 10 * day * 1000).toISOString(),
    LastUsedAt: new Date(Date.now() - 3 * day * 1000).toISOString(),
    InUse: false,
    Shared: true,
  },
];

// ---------------------------------------------------------------------------
// Mock log lines
// ---------------------------------------------------------------------------

function generateMockLogs(containerId: string): ContainerLogEntry[] {
  const container = mockContainers.find((c) => c.Id === containerId);
  if (!container) {return [];}
  const name =
    container.Labels['com.docker.compose.service'] ||
    container.Names[0]?.replace('/', '');

  const logTemplates: Record<string, string[]> = {
    web: [
      'GET /api/health 200 2ms',
      'GET /static/js/main.chunk.js 200 5ms',
      'POST /api/auth/login 200 45ms',
      'GET /api/users?page=1 200 12ms',
      'WebSocket connection established',
      'Hot module replacement connected',
      'GET /favicon.ico 304 1ms',
      'Compiled successfully in 234ms',
    ],
    api: [
      'INFO: Application startup complete.',
      'INFO: Uvicorn running on http://0.0.0.0:8000',
      'DEBUG: SQL query executed in 3.2ms',
      'INFO: POST /api/v1/users - 201 Created',
      'WARNING: Rate limit approaching for IP 192.168.1.100',
      'INFO: Background task completed: send_email',
      'DEBUG: Cache hit for key: user_profile_42',
      'INFO: GET /api/v1/products - 200 OK (15ms)',
    ],
    db: [
      'LOG:  checkpoint starting: time',
      'LOG:  checkpoint complete: wrote 42 buffers (0.3%)',
      'LOG:  connection received: host=172.18.0.4 port=45678',
      'LOG:  connection authorized: user=myapp database=myapp',
      'STATEMENT:  SELECT * FROM users WHERE id = $1',
      'LOG:  duration: 1.234 ms',
    ],
    redis: [
      '1:M * DB 0: 42 keys (0 volatile)',
      '1:M * Background saving started',
      '1:M * DB saved on disk',
      '1:M * RDB: 0 MB of memory used by copy-on-write',
      '1:M * Connection accepted from 172.18.0.4:34567',
    ],
    default: [
      'Starting service...',
      'Service is ready.',
      'Handling request...',
      'Request completed.',
      'Health check: OK',
    ],
  };

  const templates = logTemplates[name] || logTemplates.default;
  const entries: ContainerLogEntry[] = [];
  const baseTime = Date.now() - 3600000;

  for (let i = 0; i < 80; i++) {
    const ts = new Date(baseTime + i * 45000).toISOString();
    entries.push({
      timestamp: ts,
      stream: Math.random() > 0.9 ? 'stderr' : 'stdout',
      message: templates[i % templates.length],
    });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Simulated latency helper
// ---------------------------------------------------------------------------

function delay(ms = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Docker Service (mock implementation)
// ---------------------------------------------------------------------------

class DockerService {
  private containers: Container[] = [...mockContainers];

  async listContainers(): Promise<Container[]> {
    await delay(80);
    return [...this.containers];
  }

  async inspectContainer(id: string): Promise<ContainerInspect | null> {
    await delay(60);
    const c = this.containers.find((ct) => ct.Id === id);
    if (!c) {return null;}
    return {
      ...c,
      Config: {
        Env: [
          'NODE_ENV=production',
          'PORT=3000',
          'DATABASE_URL=postgresql://user:pass@db:5432/myapp',
          'REDIS_URL=redis://redis:6379',
        ],
        Cmd: c.Command.split(' '),
        Image: c.Image,
        WorkingDir: '/app',
        Entrypoint: [],
        ExposedPorts: Object.fromEntries(
          c.Ports.map((p) => [`${p.PrivatePort}/${p.Type}`, {}]),
        ),
      },
      HostConfig: {
        Memory: 536870912,
        CpuShares: 1024,
        RestartPolicy: { Name: 'unless-stopped', MaximumRetryCount: 0 },
      },
    };
  }

  async startContainer(id: string): Promise<boolean> {
    await delay(300);
    const c = this.containers.find((ct) => ct.Id === id);
    if (!c) {return false;}
    c.State = 'running';
    c.Status = 'Up less than a second';
    return true;
  }

  async stopContainer(id: string): Promise<boolean> {
    await delay(500);
    const c = this.containers.find((ct) => ct.Id === id);
    if (!c) {return false;}
    c.State = 'exited';
    c.Status = 'Exited (0) just now';
    return true;
  }

  async restartContainer(id: string): Promise<boolean> {
    await delay(800);
    const c = this.containers.find((ct) => ct.Id === id);
    if (!c) {return false;}
    c.State = 'running';
    c.Status = 'Up less than a second';
    return true;
  }

  async removeContainer(id: string): Promise<boolean> {
    await delay(200);
    const idx = this.containers.findIndex((ct) => ct.Id === id);
    if (idx === -1) {return false;}
    this.containers.splice(idx, 1);
    return true;
  }

  async getContainerLogs(id: string): Promise<ContainerLogEntry[]> {
    await delay(120);
    return generateMockLogs(id);
  }

  async listImages(): Promise<DockerImage[]> {
    await delay(80);
    return [...mockImages];
  }

  async removeImage(id: string): Promise<boolean> {
    await delay(300);
    const idx = mockImages.findIndex((i) => i.Id === id);
    if (idx === -1) {return false;}
    mockImages.splice(idx, 1);
    return true;
  }

  async listVolumes(): Promise<DockerVolume[]> {
    await delay(80);
    return [...mockVolumes];
  }

  async removeVolume(name: string): Promise<boolean> {
    await delay(200);
    const idx = mockVolumes.findIndex((v) => v.Name === name);
    if (idx === -1) {return false;}
    mockVolumes.splice(idx, 1);
    return true;
  }

  async getSystemDiskUsage(): Promise<SystemDiskUsage> {
    await delay(200);
    return {
      Images: [...mockImages],
      Containers: [...this.containers],
      Volumes: [...mockVolumes],
      BuildCache: [...mockBuildCache],
      LayersSize: mockImages.reduce((sum, img) => sum + img.Size, 0),
    };
  }

  async pruneContainers(): Promise<{ count: number; spaceReclaimed: number }> {
    await delay(400);
    const stopped = this.containers.filter((c) => c.State === 'exited');
    const space = stopped.length * 50_000_000;
    this.containers = this.containers.filter((c) => c.State !== 'exited');
    return { count: stopped.length, spaceReclaimed: space };
  }

  async pruneImages(): Promise<{ count: number; spaceReclaimed: number }> {
    await delay(400);
    const dangling = mockImages.filter(
      (i) => i.RepoTags[0] === '<none>:<none>',
    );
    const space = dangling.reduce((sum, i) => sum + i.Size, 0);
    const ids = new Set(dangling.map((i) => i.Id));
    const remaining = mockImages.filter((i) => !ids.has(i.Id));
    mockImages.length = 0;
    mockImages.push(...remaining);
    return { count: dangling.length, spaceReclaimed: space };
  }

  async pruneVolumes(): Promise<{ count: number; spaceReclaimed: number }> {
    await delay(400);
    const unused = mockVolumes.filter(
      (v) => v.UsageData && v.UsageData.RefCount === 0,
    );
    const space = unused.reduce(
      (sum, v) => sum + (v.UsageData?.Size || 0),
      0,
    );
    const names = new Set(unused.map((v) => v.Name));
    const remaining = mockVolumes.filter((v) => !names.has(v.Name));
    mockVolumes.length = 0;
    mockVolumes.push(...remaining);
    return { count: unused.length, spaceReclaimed: space };
  }

  async pruneBuildCache(): Promise<{ count: number; spaceReclaimed: number }> {
    await delay(400);
    const prunable = mockBuildCache.filter((b) => !b.InUse);
    const space = prunable.reduce((sum, b) => sum + b.Size, 0);
    const remaining = mockBuildCache.filter((b) => b.InUse);
    mockBuildCache.length = 0;
    mockBuildCache.push(...remaining);
    return { count: prunable.length, spaceReclaimed: space };
  }
}

export const dockerService = new DockerService();
