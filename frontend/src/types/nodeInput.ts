export interface NodeInput {
  key: string;
  label: string;
  defaultValue: string;
  required?: boolean;
  type?: string;
  options?: string[]; 
  placeholder?: string;
}
