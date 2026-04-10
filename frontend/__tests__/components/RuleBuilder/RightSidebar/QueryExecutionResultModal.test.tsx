import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import QueryExecutionResultModal from '../../../../src/components/RuleBuilder/RightSidebar/components/QueryExecutionResultModal';

describe('QueryExecutionResultModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders error state', () => {
    render(
      <QueryExecutionResultModal
        open
        onClose={onClose}
        results={null}
        error="Execution failed"
      />
    );

    expect(screen.getByText('Execution failed')).toBeInTheDocument();
  });

  it('renders empty success state when no results are returned', () => {
    render(
      <QueryExecutionResultModal
        open
        onClose={onClose}
        results={[]}
      />
    );

    expect(screen.getByText('Query executed successfully but returned no results.')).toBeInTheDocument();
  });

  it('renders table with row/column chips and pagination message', () => {
    render(
      <QueryExecutionResultModal
        open
        onClose={onClose}
        results={[{ id: 1, name: 'John', extra: null }]}
        totalCount={100}
        displayCount={1}
      />
    );

    expect(screen.getByText('Showing 1 of 100 total records. This is a preview to help verify your query.')).toBeInTheDocument();
    expect(screen.getByText('1 row')).toBeInTheDocument();
    expect(screen.getByText('3 columns')).toBeInTheDocument();
    expect(screen.getByText('NULL')).toBeInTheDocument();
  });

  it('expands long cell content on icon click and closes modal', () => {
    const longValue = 'x'.repeat(80);

    render(
      <QueryExecutionResultModal
        open
        onClose={onClose}
        results={[{ id: 1, description: longValue }]}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(screen.getByText(longValue)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });
});
