import type { RuleBuildResult, RulePackage } from './rule-pipeline.service';
import type { RuleSource } from './rule-workspace';

export const RULE_PIPELINE_QUEUE = 'rule-pipeline';
export const ARTIFACT_PROFILE = Symbol('ARTIFACT_PROFILE');

export interface RuleBuildJobData {
  ruleDbId: number;
  ruleConfigId: string;
  source: RuleSource;
  simulate: boolean;
  requestedBy?: string;
}

export interface RuleSimulationResult {
  ok: boolean;
  upMs?: number;
  subject?: string;
  error?: string;
}

export interface RuleBuildJobResult {
  build: Omit<RuleBuildResult, 'package' | 'reportHtml'> & { package?: Omit<RulePackage, 'tgz'> };
  reportHtml?: string;
  packageTgz?: string;
  simulation?: RuleSimulationResult;
  error?: string;
  failedStage?: string;
}

export interface RuleBuildProgress {
  stage: string;
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
  simulate: boolean;
  requestedBy?: string;
  createdAt: string;
  finishedAt?: string;
  error?: string;
  tests?: RuleBuildResult['tests'];
  package?: Omit<RulePackage, 'tgz'>;
  image?: RuleBuildResult['image'];
  gitRepo?: string;
  durationsMs?: Record<string, number>;
  simulation?: RuleSimulationResult;
  hasReport: boolean;
}

export interface RulePipelineConfigView {
  enabled: boolean;
  npm: { source: string; registry?: string; scopeRegistry?: string; cache?: string };
  image: { build: boolean; registry?: string; namespace: string };
  git: { kind: string; url?: string; owner?: string; branch?: string };
}
