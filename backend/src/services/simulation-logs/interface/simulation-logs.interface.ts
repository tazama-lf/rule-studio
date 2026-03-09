export interface ISimulationLog {
  old_data?: Record<string, unknown>;
  new_data: Record<string, unknown>;
  description?: string;
  category: string;
  rule_id: string;
}
