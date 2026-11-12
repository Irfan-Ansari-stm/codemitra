import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlogSearchInput } from '@/components/blog/BlogSearchInput';

describe('BlogSearchInput', () => {
  it('renders a search field with an accessible label', () => {
    render(<BlogSearchInput value="" onChange={() => {}} />);
    expect(
      screen.getByLabelText('Search articles')
    ).toBeInTheDocument();
  });

  it('calls onChange when the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BlogSearchInput value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Search articles'), 'abc');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('shows a clear button when a value is present', () => {
    const onChange = vi.fn();
    render(<BlogSearchInput value="algorithms" onChange={onChange} />);
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('does not show a clear button when empty', () => {
    render(<BlogSearchInput value="" onChange={() => {}} />);
    expect(
      screen.queryByRole('button', { name: 'Clear search' })
    ).not.toBeInTheDocument();
  });

  it('supports the "/" keyboard shortcut to focus', () => {
    render(<BlogSearchInput value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Search articles');
    fireEvent.keyDown(document, { key: '/' });
    expect(document.activeElement).toBe(input);
  });
});
