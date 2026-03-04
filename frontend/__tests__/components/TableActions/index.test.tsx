import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableActions from '../../../src/components/TableActions';

describe('TableActions', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<TableActions />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render container with flex layout', () => {
      const { container } = render(<TableActions />);
      const box = container.firstChild as HTMLElement;
      expect(box).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
      });
    });

    it('should render no buttons when no handlers are provided', () => {
      render(<TableActions />);
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('View Action', () => {
    it('should render view button when onView is provided', () => {
      render(<TableActions onView={jest.fn()} />);
      const viewButton = screen.getByRole('button', { name: /view/i });
      expect(viewButton).toBeInTheDocument();
    });

    it('should call onView when view button is clicked', () => {
      const onView = jest.fn();
      render(<TableActions onView={onView} />);
      
      const viewButton = screen.getByRole('button', { name: /view/i });
      fireEvent.click(viewButton);
      
      expect(onView).toHaveBeenCalledTimes(1);
    });

    it('should show "View" tooltip on view button', () => {
      render(<TableActions onView={jest.fn()} />);
      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    });

    it('should not render view button when onView is not provided', () => {
      render(<TableActions onEdit={jest.fn()} />);
      expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument();
    });
  });

  describe('Edit Action', () => {
    it('should render edit button when onEdit is provided', () => {
      render(<TableActions onEdit={jest.fn()} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = jest.fn();
      render(<TableActions onEdit={onEdit} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);
      
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('should show "Edit" tooltip on edit button', () => {
      render(<TableActions onEdit={jest.fn()} />);
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('should not render edit button when onEdit is not provided', () => {
      render(<TableActions onView={jest.fn()} />);
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });

  describe('Delete Action', () => {
    it('should render delete button when onDelete is provided', () => {
      render(<TableActions onDelete={jest.fn()} />);
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('should call onDelete when delete button is clicked', () => {
      const onDelete = jest.fn();
      render(<TableActions onDelete={onDelete} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);
      
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should show "Delete" tooltip on delete button', () => {
      render(<TableActions onDelete={jest.fn()} />);
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should not render delete button when onDelete is not provided', () => {
      render(<TableActions onView={jest.fn()} />);
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('should render delete button last', () => {
      render(<TableActions onView={jest.fn()} onEdit={jest.fn()} onDelete={jest.fn()} />);
      
      const buttons = screen.getAllByRole('button');
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      
      expect(buttons[buttons.length - 1]).toBe(deleteButton);
    });
  });

  describe('Clone Action', () => {
    it('should render clone button when onClone is provided', () => {
      render(<TableActions onClone={jest.fn()} />);
      const cloneButton = screen.getByRole('button', { name: /clone/i });
      expect(cloneButton).toBeInTheDocument();
    });

    it('should call onClone when clone button is clicked', () => {
      const onClone = jest.fn();
      render(<TableActions onClone={onClone} />);
      
      const cloneButton = screen.getByRole('button', { name: /clone/i });
      fireEvent.click(cloneButton);
      
      expect(onClone).toHaveBeenCalledTimes(1);
    });

    it('should show "Clone" tooltip on clone button', () => {
      render(<TableActions onClone={jest.fn()} />);
      expect(screen.getByRole('button', { name: /clone/i })).toBeInTheDocument();
    });

    it('should not render clone button when onClone is not provided', () => {
      render(<TableActions onView={jest.fn()} />);
      expect(screen.queryByRole('button', { name: /clone/i })).not.toBeInTheDocument();
    });
  });

  describe('Hold/Pause Action', () => {
    it('should render pause button when onHold is provided and pause is false', () => {
      render(<TableActions onHold={jest.fn()} pause={false} />);
      const holdButton = screen.getByRole('button', { name: /pause/i });
      expect(holdButton).toBeInTheDocument();
    });

    it('should render resume button when onHold is provided and pause is true', () => {
      render(<TableActions onHold={jest.fn()} pause={true} />);
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      expect(resumeButton).toBeInTheDocument();
    });

    it('should call onHold when pause button is clicked', () => {
      const onHold = jest.fn();
      render(<TableActions onHold={onHold} pause={false} />);
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);
      
      expect(onHold).toHaveBeenCalledTimes(1);
    });

    it('should call onHold when resume button is clicked', () => {
      const onHold = jest.fn();
      render(<TableActions onHold={onHold} pause={true} />);
      
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(resumeButton);
      
      expect(onHold).toHaveBeenCalledTimes(1);
    });

    it('should show "Pause" tooltip when pause is false', () => {
      render(<TableActions onHold={jest.fn()} pause={false} />);
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should show "Resume" tooltip when pause is true', () => {
      render(<TableActions onHold={jest.fn()} pause={true} />);
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    it('should not render hold button when onHold is not provided', () => {
      render(<TableActions onView={jest.fn()} />);
      expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /resume/i })).not.toBeInTheDocument();
    });

    it('should default pause to false', () => {
      render(<TableActions onHold={jest.fn()} />);
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  describe('Toggle Status Action', () => {
    it('should render status button when onToggleStatus is provided', () => {
      render(<TableActions onToggleStatus={jest.fn()} />);
      const statusButton = screen.getByRole('button', { name: /mark active/i });
      expect(statusButton).toBeInTheDocument();
    });

    it('should show "Mark Active" tooltip when active is false', () => {
      render(<TableActions onToggleStatus={jest.fn()} active={false} />);
      expect(screen.getByRole('button', { name: /mark active/i })).toBeInTheDocument();
    });

    it('should show "Mark Inactive" tooltip when active is true', () => {
      render(<TableActions onToggleStatus={jest.fn()} active={true} />);
      expect(screen.getByRole('button', { name: /mark inactive/i })).toBeInTheDocument();
    });

    it('should call onToggleStatus when button is clicked', () => {
      const onToggleStatus = jest.fn();
      render(<TableActions onToggleStatus={onToggleStatus} />);
      
      const statusButton = screen.getByRole('button', { name: /mark active/i });
      fireEvent.click(statusButton);
      
      expect(onToggleStatus).toHaveBeenCalledTimes(1);
    });

    it('should not render toggle status button when onToggleStatus is not provided', () => {
      render(<TableActions onView={jest.fn()} />);
      expect(screen.queryByRole('button', { name: /mark active/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /mark inactive/i })).not.toBeInTheDocument();
    });

    it('should default active to false', () => {
      render(<TableActions onToggleStatus={jest.fn()} />);
      expect(screen.getByRole('button', { name: /mark active/i })).toBeInTheDocument();
    });
  });

  describe('Multiple Actions', () => {
    it('should render all buttons when all handlers are provided', () => {
      render(
        <TableActions
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onClone={jest.fn()}
          onHold={jest.fn()}
          onToggleStatus={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clone/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark active/i })).toBeInTheDocument();
    });

    it('should render only provided action buttons', () => {
      render(<TableActions onView={jest.fn()} onDelete={jest.fn()} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should call respective handlers when multiple buttons are clicked', () => {
      const onView = jest.fn();
      const onEdit = jest.fn();
      const onDelete = jest.fn();

      render(<TableActions onView={onView} onEdit={onEdit} onDelete={onDelete} />);

      fireEvent.click(screen.getByRole('button', { name: /view/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      expect(onView).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Children', () => {
    it('should render custom children', () => {
      render(
        <TableActions>
          <button data-testid="custom-button">Custom Action</button>
        </TableActions>
      );

      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should render children along with action buttons', () => {
      render(
        <TableActions onView={jest.fn()}>
          <button data-testid="custom-button">Custom Action</button>
        </TableActions>
      );

      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should render children before delete button', () => {
      render(
        <TableActions onDelete={jest.fn()}>
          <button data-testid="custom-button">Custom</button>
        </TableActions>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('data-testid', 'custom-button');
      expect(buttons[1]).toHaveAccessibleName(/delete/i);
    });

    it('should handle multiple children', () => {
      render(
        <TableActions>
          <button data-testid="custom-1">Custom 1</button>
          <button data-testid="custom-2">Custom 2</button>
        </TableActions>
      );

      expect(screen.getByTestId('custom-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-2')).toBeInTheDocument();
    });
  });

  describe('Button Order', () => {
    it('should render buttons in correct order', () => {
      render(
        <TableActions
          onView={jest.fn()}
          onEdit={jest.fn()}
          onHold={jest.fn()}
          onClone={jest.fn()}
          onToggleStatus={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAccessibleName(/view/i);
      expect(buttons[1]).toHaveAccessibleName(/edit/i);
      expect(buttons[2]).toHaveAccessibleName(/pause/i);
      expect(buttons[3]).toHaveAccessibleName(/clone/i);
      expect(buttons[4]).toHaveAccessibleName(/mark active/i);
      expect(buttons[5]).toHaveAccessibleName(/delete/i);
    });
  });

  describe('Icon Buttons', () => {
    it('should render small size buttons', () => {
      render(<TableActions onView={jest.fn()} />);
      const button = screen.getByRole('button', { name: /view/i });
      expect(button).toHaveClass('MuiIconButton-sizeSmall');
    });

    it('should have icons with small fontSize', () => {
      const { container } = render(<TableActions onView={jest.fn()} />);
      const icon = container.querySelector('.MuiSvgIcon-fontSizeSmall');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Component Memo', () => {
    it('should render consistently across re-renders with same props', () => {
      const onView = jest.fn();
      const { rerender, container } = render(<TableActions onView={onView} />);

      const initialHTML = container.innerHTML;

      rerender(<TableActions onView={onView} />);

      expect(container.innerHTML).toBe(initialHTML);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button names from tooltips', () => {
      render(
        <TableActions
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should render all buttons as clickable elements', () => {
      render(
        <TableActions
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeEnabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle all props set to undefined', () => {
      expect(() => render(<TableActions />)).not.toThrow();
    });

    it('should handle rapid clicks on the same button', () => {
      const onView = jest.fn();
      render(<TableActions onView={onView} />);

      const viewButton = screen.getByRole('button', { name: /view/i });
      fireEvent.click(viewButton);
      fireEvent.click(viewButton);
      fireEvent.click(viewButton);

      expect(onView).toHaveBeenCalledTimes(3);
    });

    it('should handle clicks on multiple buttons', () => {
      const onView = jest.fn();
      const onEdit = jest.fn();
      const onDelete = jest.fn();

      render(<TableActions onView={onView} onEdit={onEdit} onDelete={onDelete} />);

      fireEvent.click(screen.getByRole('button', { name: /view/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      expect(onView).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should handle active state changes', () => {
      const { rerender } = render(<TableActions onToggleStatus={jest.fn()} active={false} />);

      expect(screen.getByRole('button', { name: /mark active/i })).toBeInTheDocument();

      rerender(<TableActions onToggleStatus={jest.fn()} active={true} />);

      expect(screen.getByRole('button', { name: /mark inactive/i })).toBeInTheDocument();
    });

    it('should handle pause state changes', () => {
      const { rerender } = render(<TableActions onHold={jest.fn()} pause={false} />);

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

      rerender(<TableActions onHold={jest.fn()} pause={true} />);

      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should work with all features enabled', () => {
      const onView = jest.fn();
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      const onClone = jest.fn();
      const onHold = jest.fn();
      const onToggleStatus = jest.fn();

      render(
        <TableActions
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onClone={onClone}
          onHold={onHold}
          onToggleStatus={onToggleStatus}
          active={true}
          pause={true}
        >
          <button data-testid="custom">Custom</button>
        </TableActions>
      );

      // All buttons should be present
      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clone/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark inactive/i })).toBeInTheDocument();
      expect(screen.getByTestId('custom')).toBeInTheDocument();

      // Test all handlers
      fireEvent.click(screen.getByRole('button', { name: /view/i }));
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      fireEvent.click(screen.getByRole('button', { name: /clone/i }));
      fireEvent.click(screen.getByRole('button', { name: /resume/i }));
      fireEvent.click(screen.getByRole('button', { name: /mark inactive/i }));

      expect(onView).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onClone).toHaveBeenCalledTimes(1);
      expect(onHold).toHaveBeenCalledTimes(1);
      expect(onToggleStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle dynamic handler changes', () => {
      const onView1 = jest.fn();
      const onView2 = jest.fn();

      const { rerender } = render(<TableActions onView={onView1} />);

      fireEvent.click(screen.getByRole('button', { name: /view/i }));
      expect(onView1).toHaveBeenCalledTimes(1);

      rerender(<TableActions onView={onView2} />);

      fireEvent.click(screen.getByRole('button', { name: /view/i }));
      expect(onView2).toHaveBeenCalledTimes(1);
      expect(onView1).toHaveBeenCalledTimes(1);
    });
  });
});
