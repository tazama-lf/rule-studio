export interface NodeInput {
  key: string;
  label: string;
  defaultValue: string;
  required?: boolean;
  type?: string; // e.g., 'text', 'textarea', 'dropdown', 'json'
  options?: string[]; // For dropdown inputs
  placeholder?: string; // Placeholder text for inputs
}
