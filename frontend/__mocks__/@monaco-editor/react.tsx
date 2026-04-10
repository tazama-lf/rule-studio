 
/* eslint-disable */
import React from 'react';

// Mock Monaco Editor
export const Editor = ({ value, onChange, language, ...props }: any) => (
  <textarea
    data-testid="monaco-editor"
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
    data-language={language}
    {...props}
  />
);

export const DiffEditor = () => <div data-testid="monaco-diff-editor" />;

export const useMonaco = () => null;

export default Editor;
