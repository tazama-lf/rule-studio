import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import FunctionPropertiesSection from '../../../../src/components/RuleBuilder/RightSidebar/components/FunctionPropertiesSection';
import ConnectionInfoSection from '../../../../src/components/RuleBuilder/RightSidebar/components/ConnectionInfoSection';

describe('FunctionPropertiesSection', () => {
  it('renders description when present', () => {
    render(<FunctionPropertiesSection template={{ description: 'My function description' }} />);

    expect(screen.getByText('Function Properties')).toBeInTheDocument();
    expect(screen.getByText('My function description')).toBeInTheDocument();
  });

  it('returns null when description is missing', () => {
    const { container } = render(<FunctionPropertiesSection template={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ConnectionInfoSection', () => {
  it('renders both chips when source and target handles are true', () => {
    render(
      <ConnectionInfoSection
        template={{
          displayName: 'Node',
          handles: { source: true, target: true },
        }}
      />
    );

    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(screen.getByText('Has Input')).toBeInTheDocument();
    expect(screen.getByText('Has Output')).toBeInTheDocument();
  });

  it('renders no chips when source and target handles are false', () => {
    render(
      <ConnectionInfoSection
        template={{
          displayName: 'Node',
          handles: { source: false, target: false },
        }}
      />
    );

    expect(screen.queryByText('Has Input')).not.toBeInTheDocument();
    expect(screen.queryByText('Has Output')).not.toBeInTheDocument();
  });
});
