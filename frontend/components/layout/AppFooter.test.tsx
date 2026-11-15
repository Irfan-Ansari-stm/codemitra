import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppFooter } from '@/components/layout/AppFooter';
import { newsletterApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  newsletterApi: {
    subscribe: vi.fn().mockResolvedValue({ success: true }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AppFooter Redesigned Enterprise Suite', () => {
  it('renders brand identity, official description, and capabilities tags', () => {
    render(<AppFooter />);

    expect(screen.getByRole('link', { name: 'CodeVerse home' })).toBeInTheDocument();
    expect(
      screen.getByText(/CodeVerse empowers developers and learners through modern coding education/i)
    ).toBeInTheDocument();
    expect(screen.getByText('WASM Execution')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL RLS')).toBeInTheDocument();
  });

  it('renders quick navigation links pointing to real existing routes', () => {
    render(<AppFooter />);

    expect(screen.getByRole('link', { name: 'Coding Challenges' })).toHaveAttribute(
      'href',
      '/problems'
    );
    expect(screen.getByRole('link', { name: 'Course Catalog' })).toHaveAttribute(
      'href',
      '/courses'
    );
    expect(screen.getByRole('link', { name: /Online IDE/i })).toHaveAttribute(
      'href',
      '/dashboard/ide'
    );
    expect(screen.getByRole('link', { name: 'Blog & Insights' })).toHaveAttribute(
      'href',
      '/blog'
    );
    expect(screen.getByRole('link', { name: 'About CodeVerse' })).toHaveAttribute(
      'href',
      '/about'
    );
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute(
      'href',
      '/contact'
    );
  });

  it('renders social media channels and copyright bar with dynamic year', () => {
    render(<AppFooter />);

    expect(screen.getByTitle('GitHub')).toBeInTheDocument();
    expect(screen.getByTitle('LinkedIn')).toBeInTheDocument();
    expect(screen.getByTitle('Community Discord')).toBeInTheDocument();

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} CodeVerse Inc.`))).toBeInTheDocument();
    expect(screen.getByText('All systems operational')).toBeInTheDocument();
  });

  it('handles newsletter subscription form with validation and API call', async () => {
    render(<AppFooter />);

    const input = screen.getByLabelText('Email address for newsletter');
    const subscribeBtn = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(input, { target: { value: 'dev@test.org' } });
    fireEvent.click(subscribeBtn);

    await waitFor(() => {
      expect(newsletterApi.subscribe).toHaveBeenCalledWith('dev@test.org');
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Thank you! You are subscribed to CodeVerse updates./i)
      ).toBeInTheDocument();
    });
  });
});
