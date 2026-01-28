import React from 'react';
import type { NodeInput } from '../../../../../types/nodeInput';
import { PropertyRow } from '../../styles';
import CodeEditor from '../CodeEditor';

interface CodeEditorFieldProps {
  input: NodeInput;
  currentValue: string;
  hasError: boolean;
  fieldError: string | undefined;
  isReadOnly: boolean;
  viewOnly: boolean;
  onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onParamBlur?: () => void;
  onDrop: (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
}

const CodeEditorField: React.FC<CodeEditorFieldProps> = ({
  input,
  currentValue,
  hasError,
  fieldError,
  isReadOnly,
  viewOnly,
  onParamChange,
  onParamBlur,
  onDrop,
  onDragOver,
}) => {
  const height = ['code', 'loopBody', 'code_template'].includes(input.key) ? '500px' : '350px';
  
  return (
    <PropertyRow
      key={input.key}
      onDrop={onDrop(input.key)}
      onDragOver={onDragOver}
    >
      <CodeEditor
        value={currentValue}
        onChange={(value) => {
          const syntheticEvent = {
            target: { value }
          } as React.ChangeEvent<HTMLInputElement>;
          onParamChange(input.key)(syntheticEvent);
        }}
        onBlur={onParamBlur}
        label={input.label}
        disabled={isReadOnly || viewOnly}
        error={hasError}
        helperText={fieldError || (isReadOnly ? 'Start/End nodes cannot be edited' : '') || (viewOnly ? 'View only mode' : '')}
        language={input.key === 'query' ? 'sql' : 'typescript'}
        height={height}
        required={input.required}
      />
    </PropertyRow>
  );
};

export default React.memo(CodeEditorField);
