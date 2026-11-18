import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';
import { Modal } from './Modal';
import { Tabs } from './Tabs';
import { StarRating } from './StarRating';
import { StatusBadge } from './Badge';
describe('accessible shared controls', () => {
  it('associates labels, help and errors with unique field IDs', () => {
    render(
      <>
        <Input label="Email" hint="Help" error="Invalid" />
        <Input label="Email" />
      </>,
    );
    const [first, second] = screen.getAllByLabelText('Email');
    expect(first.id).not.toBe(second.id);
    expect(first).toHaveAttribute('aria-invalid', 'true');
    expect(first).toHaveAccessibleDescription('Help Invalid');
  });
  it('uses a named native modal, locks scroll and restores focus', () => {
    const close = vi.fn();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const { rerender } = render(
      <Modal isOpen onClose={close} title="Delete adventure">
        <p>Confirm</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Delete adventure' })).toHaveAttribute('open');
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(close).toHaveBeenCalledTimes(1);
    rerender(
      <Modal isOpen={false} onClose={close} title="Delete adventure">
        <p>Confirm</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
  it('supports tab keyboard navigation', () => {
    const change = vi.fn();
    render(
      <Tabs
        label="Role"
        panelId="panel"
        tabs={[
          { value: 'dm', label: 'Master' },
          { value: 'player', label: 'Player' },
        ]}
        value="dm"
        onChange={change}
      />,
    );
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Master' }), { key: 'ArrowRight' });
    expect(change).toHaveBeenCalledWith('player');
    expect(screen.getByRole('tab', { name: 'Player' })).toHaveFocus();
  });
  it('renders a keyboard-accessible rating field and distinct statuses', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <>
        <StarRating rating={3} interactive onChange={change} />
        <StatusBadge status="in_progress" />
        <StatusBadge status="completed" />
      </>,
    );
    await user.click(screen.getByRole('radio', { name: '5 out of 5 stars' }));
    expect(change).toHaveBeenCalledWith(5);
    expect(screen.getByText('In progress')).toBeVisible();
    expect(screen.getByText('Completed')).toBeVisible();
  });
});
