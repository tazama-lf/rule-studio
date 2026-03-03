import React from 'react';
import { render, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SecondaryContainer, SectionContainer } from '../../../src/components/Containers';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('Containers', () => {
  describe('SecondaryContainer', () => {
    it('should render children', () => {
      const { container } = renderWithTheme(
        <SecondaryContainer>
          <div>Child Content</div>
        </SecondaryContainer>
      );
      expect(within(container).getByText('Child Content')).toBeInTheDocument();
    });

    it('should render as a Grid element', () => {
      const { container } = renderWithTheme(
        <SecondaryContainer>Content</SecondaryContainer>
      );
      const grid = container.querySelector('.MuiGrid-root');
      expect(grid).toBeInTheDocument();
    });

    it('should apply height based on NAV_HEIGHT', () => {
      const { container } = renderWithTheme(
        <SecondaryContainer>Content</SecondaryContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ height: 'calc(100vh - 60px)' });
    });

    it('should apply 90% width', () => {
      const { container } = renderWithTheme(
        <SecondaryContainer>Content</SecondaryContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ width: '90%' });
    });

    it('should center content horizontally', () => {
      const { container } = renderWithTheme(
        <SecondaryContainer>Content</SecondaryContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ margin: 'auto' });
    });

    it('should center items vertically', () => {
      const { container } = renderWithTheme(
        <SecondaryContainer>Content</SecondaryContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ alignItems: 'center' });
    });

    it('should justify content to center', () => {
      const { container } = renderWithTheme(
        <SecondaryContainer>Content</SecondaryContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ justifyContent: 'center' });
    });

    it('should render multiple children', () => {
      const { container } = renderWithTheme(
        <SecondaryContainer>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </SecondaryContainer>
      );
      expect(within(container).getByText('First')).toBeInTheDocument();
      expect(within(container).getByText('Second')).toBeInTheDocument();
      expect(within(container).getByText('Third')).toBeInTheDocument();
    });

    it('should accept additional sx props', () => {
      const { container } = renderWithTheme(
        <SecondaryContainer sx={{ padding: '20px' }}>Content</SecondaryContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ padding: '20px' });
    });
  });

  describe('SectionContainer', () => {
    it('should render children', () => {
      const { container } = renderWithTheme(
        <SectionContainer>
          <div>Section Content</div>
        </SectionContainer>
      );
      expect(within(container).getByText('Section Content')).toBeInTheDocument();
    });

    it('should render as a Grid element', () => {
      const { container } = renderWithTheme(
        <SectionContainer>Content</SectionContainer>
      );
      const grid = container.querySelector('.MuiGrid-root');
      expect(grid).toBeInTheDocument();
    });

    it('should override height to auto', () => {
      const { container } = renderWithTheme(
        <SectionContainer>Content</SectionContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ height: 'auto' });
    });

    it('should inherit 90% width from SecondaryContainer', () => {
      const { container } = renderWithTheme(
        <SectionContainer>Content</SectionContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ width: '90%' });
    });

    it('should inherit center alignment from SecondaryContainer', () => {
      const { container } = renderWithTheme(
        <SectionContainer>Content</SectionContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ alignItems: 'center', justifyContent: 'center' });
    });

    it('should inherit auto margin from SecondaryContainer', () => {
      const { container } = renderWithTheme(
        <SectionContainer>Content</SectionContainer>
      );
      const el = container.firstChild as HTMLElement;
      // margin-left and margin-right should be auto (inherited)
      expect(el).toHaveStyle({ marginLeft: 'auto', marginRight: 'auto' });
    });

    it('should apply theme-based marginTop', () => {
      const { container } = renderWithTheme(
        <SectionContainer>Content</SectionContainer>
      );
      const el = container.firstChild as HTMLElement;
      // theme.spacing(16) = 128px
      expect(el).toHaveStyle({ marginTop: '128px' });
    });

    it('should apply theme-based marginBottom', () => {
      const { container } = renderWithTheme(
        <SectionContainer>Content</SectionContainer>
      );
      const el = container.firstChild as HTMLElement;
      // theme.spacing(16) = 128px
      expect(el).toHaveStyle({ marginBottom: '128px' });
    });

    it('should render multiple children', () => {
      const { container } = renderWithTheme(
        <SectionContainer>
          <div>Alpha</div>
          <div>Beta</div>
        </SectionContainer>
      );
      expect(within(container).getByText('Alpha')).toBeInTheDocument();
      expect(within(container).getByText('Beta')).toBeInTheDocument();
    });

    it('should accept additional sx props', () => {
      const { container } = renderWithTheme(
        <SectionContainer sx={{ padding: '16px' }}>Content</SectionContainer>
      );
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveStyle({ padding: '16px' });
    });
  });

  describe('Theme Integration', () => {
    it('should work with a custom theme spacing', () => {
      const customTheme = createTheme({ spacing: 10 });
      const { container } = render(
        <ThemeProvider theme={customTheme}>
          <SectionContainer>Content</SectionContainer>
        </ThemeProvider>
      );
      const el = container.firstChild as HTMLElement;
      // customTheme.spacing(16) = 160px
      expect(el).toHaveStyle({ marginTop: '160px', marginBottom: '160px' });
    });
  });
});
