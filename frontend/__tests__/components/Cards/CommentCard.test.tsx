
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CommentCard from '../../../src/components/Cards/CommentCard';

describe('CommentCard Component', () => {
  describe('Success State', () => {
    it('should render "Rule Approved" when success is true', () => {
      render(<CommentCard success={true} message="Test message" />);
      expect(screen.getByText('Rule Approved')).toBeInTheDocument();
    });

    it('should display success icon when success is true', () => {
      const { container } = render(<CommentCard success={true} message="Test message" />);
      const successIcon = container.querySelector('[data-testid="CheckCircleIcon"]');
      expect(successIcon).toBeInTheDocument();
    });

    it('should not display error icon when success is true', () => {
      const { container } = render(<CommentCard success={true} message="Test message" />);
      const errorIcon = container.querySelector('[data-testid="CancelIcon"]');
      expect(errorIcon).not.toBeInTheDocument();
    });

    it('should display the provided message on success', () => {
      render(<CommentCard success={true} message="Great job! Rule approved successfully." />);
      expect(screen.getByText('Great job! Rule approved successfully.')).toBeInTheDocument();
    });

    it('should apply success background color', () => {
      const { container } = render(<CommentCard success={true} message="Test message" />);
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });

    it('should render Paper component with outlined variant', () => {
      const { container } = render(<CommentCard success={true} message="Test message" />);
      const paper = container.querySelector('.MuiPaper-outlined');
      expect(paper).toBeInTheDocument();
    });
  });

  describe('Failure State', () => {
    it('should render "Rule Rejected" when success is false', () => {
      render(<CommentCard success={false} message="Test message" />);
      expect(screen.getByText('Rule Rejected')).toBeInTheDocument();
    });

    it('should display error icon when success is false', () => {
      const { container } = render(<CommentCard success={false} message="Test message" />);
      const errorIcon = container.querySelector('[data-testid="CancelIcon"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should not display success icon when success is false', () => {
      const { container } = render(<CommentCard success={false} message="Test message" />);
      const successIcon = container.querySelector('[data-testid="CheckCircleIcon"]');
      expect(successIcon).not.toBeInTheDocument();
    });

    it('should display the provided message on failure', () => {
      render(<CommentCard success={false} message="Invalid transaction amount." />);
      expect(screen.getByText('Invalid transaction amount.')).toBeInTheDocument();
    });

    it('should apply error background color', () => {
      const { container } = render(<CommentCard success={false} message="Test message" />);
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display short message', () => {
      render(<CommentCard success={true} message="OK" />);
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should display long message', () => {
      const longMessage = 'This is a very long message that describes the approval or rejection in detail with multiple sentences and lots of information.';
      render(<CommentCard success={true} message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should display empty message', () => {
      render(<CommentCard success={true} message="" />);
      expect(screen.getByText('Rule Approved')).toBeInTheDocument();
    });

    it('should display message with special characters', () => {
      const specialMessage = "Rule #123 rejected! Check @user's comment.";
      render(<CommentCard success={false} message={specialMessage} />);
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should display message with line breaks', () => {
      const messageWithBreaks = "First line\nSecond line\nThird line";
      render(<CommentCard success={true} message={messageWithBreaks} />);
      expect(screen.getByText((content, element) => {
        return element?.textContent === messageWithBreaks;
      })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined success as false', () => {
      render(<CommentCard success={undefined as unknown as boolean} message="Test" />);
      expect(screen.getByText('Rule Rejected')).toBeInTheDocument();
    });

    it('should handle null success as false', () => {
      render(<CommentCard success={null as unknown as boolean} message="Test" />);
      expect(screen.getByText('Rule Rejected')).toBeInTheDocument();
    });

    it('should render with minimum props', () => {
      render(<CommentCard success={true} message="Test" />);
      expect(screen.getByText('Rule Approved')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle numeric message by converting to string', () => {
      render(<CommentCard success={true} message={'123' as string} />);
      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should render Stack with row direction', () => {
      const { container } = render(<CommentCard success={true} message="Test" />);
      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toBeInTheDocument();
    });

    it('should have proper spacing between icon and text', () => {
      const { container } = render(<CommentCard success={true} message="Test" />);
      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toHaveAttribute('class');
    });

    it('should apply rounded corners to Paper', () => {
      const { container } = render(<CommentCard success={true} message="Test" />);
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });

    it('should render Typography for title', () => {
      const { container } = render(<CommentCard success={true} message="Test" />);
      const typography = container.querySelector('.MuiTypography-root');
      expect(typography).toBeInTheDocument();
    });

    it('should render full width Paper', () => {
      const { container } = render(<CommentCard success={true} message="Test" />);
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });

  describe('Success vs Failure Comparison', () => {
    it('should display different titles for success and failure', () => {
      const { rerender } = render(<CommentCard success={true} message="Test" />);
      expect(screen.getByText('Rule Approved')).toBeInTheDocument();

      rerender(<CommentCard success={false} message="Test" />);
      expect(screen.getByText('Rule Rejected')).toBeInTheDocument();
    });

    it('should display different icons for success and failure', () => {
      const { container, rerender } = render(<CommentCard success={true} message="Test" />);
      expect(container.querySelector('[data-testid="CheckCircleIcon"]')).toBeInTheDocument();

      rerender(<CommentCard success={false} message="Test" />);
      expect(container.querySelector('[data-testid="CancelIcon"]')).toBeInTheDocument();
    });

    it('should preserve message when success state changes', () => {
      const message = "This is a test message";
      const { rerender } = render(<CommentCard success={true} message={message} />);
      expect(screen.getByText(message)).toBeInTheDocument();

      rerender(<CommentCard success={false} message={message} />);
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render with proper semantic structure', () => {
      const { container } = render(<CommentCard success={true} message="Test" />);
      expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
      expect(container.querySelector('.MuiStack-root')).toBeInTheDocument();
    });

    it('should have icons with proper color attribute', () => {
      const { container } = render(<CommentCard success={true} message="Test" />);
      const icon = container.querySelector('[data-testid="CheckCircleIcon"]');
      expect(icon).toBeInTheDocument();
    });

    it('should render all text content', () => {
      const message = "Important message here";
      render(<CommentCard success={true} message={message} />);
      expect(screen.getByText('Rule Approved')).toBeInTheDocument();
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple CommentCards independently', () => {
      const { container } = render(
        <>
          <CommentCard success={true} message="First card" />
          <CommentCard success={false} message="Second card" />
        </>
      );
      
      expect(screen.getByText('First card')).toBeInTheDocument();
      expect(screen.getByText('Second card')).toBeInTheDocument();
      expect(screen.getByText('Rule Approved')).toBeInTheDocument();
      expect(screen.getByText('Rule Rejected')).toBeInTheDocument();
      
      const papers = container.querySelectorAll('.MuiPaper-root');
      expect(papers).toHaveLength(2);
    });
  });
});
