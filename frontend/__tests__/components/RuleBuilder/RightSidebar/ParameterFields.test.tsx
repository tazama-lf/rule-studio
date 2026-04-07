import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import CodeTemplateButton from '../../../../src/components/RuleBuilder/RightSidebar/components/ParameterFields/CodeTemplateButton';
import DropdownField from '../../../../src/components/RuleBuilder/RightSidebar/components/ParameterFields/DropdownField';
import FetchDBQueryField from '../../../../src/components/RuleBuilder/RightSidebar/components/ParameterFields/FetchDBQueryField';

describe('ParameterFields components', () => {
  it('renders CodeTemplateButton and opens modal callback', () => {
    const onOpenCodeModal = jest.fn();

    render(
      <CodeTemplateButton
        input={{ key: 'code_template', label: 'Code', defaultValue: '', required: true }}
        currentValue={'line1\nline2'}
        hasError
        fieldError="Invalid code"
        isDisabled={false}
        onOpenCodeModal={onOpenCodeModal}
      />
    );

    expect(screen.getByText('Edit Function Code')).toBeInTheDocument();
    expect(screen.getByText('2 lines of code')).toBeInTheDocument();
    expect(screen.getByText('Invalid code')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit function code/i }));
    expect(onOpenCodeModal).toHaveBeenCalledWith('code_template', 'Code', 'line1\nline2');
  });

  it('renders DropdownField and emits synthetic change', () => {
    const onParamChange = jest.fn(() => jest.fn());

    render(
      <DropdownField
        input={{ key: 'declarationType', label: 'Declaration', defaultValue: 'var', required: true }}
        currentValue=""
        hasError={false}
        helperText="Choose a declaration"
        options={[
          { value: 'var', label: 'var' },
          { value: 'let', label: 'let' },
        ]}
        isDisabled={false}
        onParamChange={onParamChange}
      />
    );

    expect(screen.getByText('Choose a declaration')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'let' }));

    expect(onParamChange).toHaveBeenCalledWith('declarationType');
  });

  it('renders FetchDBQueryField states and execute action', () => {
    const onOpenQueryEditor = jest.fn();
    const onExecuteQuery = jest.fn();

    const { rerender } = render(
      <FetchDBQueryField
        currentValue=""
        isDisabled={false}
        isExecuting={false}
        fieldError={undefined}
        onOpenQueryEditor={onOpenQueryEditor}
        onExecuteQuery={onExecuteQuery}
      />
    );

    expect(screen.getByText('Write SQL Query')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /write sql query/i }));
    expect(onOpenQueryEditor).toHaveBeenCalled();

    rerender(
      <FetchDBQueryField
        currentValue={'SELECT 1\nFROM dual'}
        isDisabled={false}
        isExecuting={false}
        fieldError={undefined}
        onOpenQueryEditor={onOpenQueryEditor}
        onExecuteQuery={onExecuteQuery}
        dbName="main"
      />
    );

    expect(screen.getByText('Edit SQL Query')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /execute & test query/i }));
    expect(onExecuteQuery).toHaveBeenCalledWith('SELECT 1\nFROM dual', 'main');

    rerender(
      <FetchDBQueryField
        currentValue="SELECT 1"
        isDisabled={false}
        isExecuting={false}
        fieldError="Query required"
        onOpenQueryEditor={onOpenQueryEditor}
        onExecuteQuery={onExecuteQuery}
      />
    );

    expect(screen.getByText('Query required')).toBeInTheDocument();
  });
});
