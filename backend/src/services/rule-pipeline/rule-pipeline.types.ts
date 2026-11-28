import type { RuleBuildResult, RulePackage } from './rule-pipeline.service';
import type { RuleSource } from './rule-workspace';

export const RULE_PIPELINE_QUEUE = 'rule-pipeline';
export const ARTIFACT_PROFILE = Symbol('ARTIFACT_PROFILE');

export interface RuleBuildJobData {
  ruleDbId: number;
  ruleConfigId: string;
  source: RuleSource;
  requestedBy?: string;
}

export interface RuleResultView {
  id?: string;
  cfg?: string;
  subRuleRef: string;
  reason?: string;
  indpdntVarbl?: number;
  wght?: number;
  prcgTm?: number;
  [key: string]: unknown;
}

export interface RuleDeployResult {
  ok: boolean;
  container?: string;
  network?: string;
  image?: string;
  typology?: string;
  networkMap?: string;
  error?: string;
}

export interface RuleEvaluation {
  evaluationID?: string;
  status?: string;
  timestamp?: string;
  tadpResult?: {
    typologyResult?: Array<{
      cfg: string;
      result?: number;
      workflow?: { alertThreshold?: number; interdictionThreshold?: number };
      ruleResults?: Array<RuleResultView & { id: string }>;
    }>;
  };
  [key: string]: unknown;
}

export interface RuleAlert {
  report: RuleEvaluation;
  transaction?: Record<string, unknown>;
  networkMap?: Record<string, unknown>;
  dataCache?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RuleRunResult {
  kind: 'rule' | 'e2e';
  ok: boolean;
  msgId?: string;
  ranAt: string;
  tookMs: number;
  result?: RuleResultView;
  reason?: string;
  alert?: RuleAlert;
  error?: string;
}

export type RuleContainerState = 'deployed' | 'starting' | 'restarting' | 'stopped';

export interface RuleDeploymentStatus {
  enabled: boolean;
  deployed: boolean;
  state?: RuleContainerState;
  restarts?: number;
  exitCode?: number;
  current?: boolean;
  container?: string;
  network?: string;
  rule?: string;
  image?: string;
  startedAt?: string;
  runs?: Partial<Record<RuleRunResult['kind'], RuleRunResult>>;
}

export interface RuleBuildJobResult {
  build: Omit<RuleBuildResult, 'package' | 'reportHtml'> & { package?: Omit<RulePackage, 'tgz'> };
  reportHtml?: string;
  packageTgz?: string;
  error?: string;
  failedStage?: string;
}

export interface RuleBuildProgress {
  stage: string;
  tests?: RuleBuildResult['tests'];
  reportHtml?: string;
}

export type RuleBuildStatus = 'queued' | 'running' | 'passed' | 'failed' | 'error';

export interface RuleBuildView {
  buildId: string;
  ruleDbId: number;
  ruleConfigId: string;
  ruleId: string;
  version: string;
  status: RuleBuildStatus;
  stage?: string;
  requestedBy?: string;
  createdAt: string;
  finishedAt?: string;
  error?: string;
  tests?: RuleBuildResult['tests'];
  package?: Omit<RulePackage, 'tgz'>;
  image?: RuleBuildResult['image'];
  gitRepo?: string;
  durationsMs?: Record<string, number>;
  hasReport: boolean;
}

export interface RulePipelineConfigView {
  enabled: boolean;
  npm: { source: string; registry?: string; scopeRegistry?: string; cache?: string };
  image: { build: boolean; registry: string; namespace: string };
  git: { kind: string; url?: string; owner?: string; branch?: string };
  deploy: { enabled: boolean; network?: string };
}
