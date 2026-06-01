import { ApiProperty } from '@nestjs/swagger';

export class DockerHubRepository {
  @ApiProperty({ example: 'rule-001', description: 'Repository name (rule name)' })
  name: string;

  @ApiProperty({ example: 'pslcopilot', description: 'Namespace the repository belongs to' })
  namespace: string;

  @ApiProperty({ example: 'image', description: 'Repository type' })
  repository_type: string;

  @ApiProperty({ example: 0, description: 'Pull count' })
  pull_count: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last updated timestamp' })
  last_updated: string;
}

export class DockerHubRepositoriesResponseDto {
  @ApiProperty({ type: [DockerHubRepository] })
  rules: DockerHubRepository[];

  @ApiProperty({ example: 5, description: 'Total number of published rules' })
  count: number;
}

export class DockerHubTag {
  @ApiProperty({ example: 'v1.0.0', description: 'Tag name' })
  name: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Tag last updated timestamp' })
  last_updated: string;

  @ApiProperty({ example: 'linux/amd64', description: 'Tag digest' })
  digest: string;
}

export class DockerHubTagsResponseDto {
  @ApiProperty({ example: 'rule-001', description: 'Rule (repository) name' })
  rule: string;

  @ApiProperty({ type: [DockerHubTag] })
  tags: DockerHubTag[];

  @ApiProperty({ example: 3, description: 'Total number of tags' })
  count: number;
}
