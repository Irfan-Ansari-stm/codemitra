import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SuperAdminContentPage from './page';
import { contentApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  contentApi: {
    getStats: vi.fn(),
    listPages: vi.fn(),
    getPage: vi.fn(),
    createPage: vi.fn(),
    updatePage: vi.fn(),
    deletePage: vi.fn(),
    getRevisions: vi.fn(),
    restoreRevision: vi.fn(),
    listBanners: vi.fn(),
    createBanner: vi.fn(),
    updateBanner: vi.fn(),
    deleteBanner: vi.fn(),
    listFaqs: vi.fn(),
    createFaq: vi.fn(),
    updateFaq: vi.fn(),
    deleteFaq: vi.fn(),
  },
}));

const mockedContentApi = vi.mocked(contentApi);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SuperAdminContentPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mockedContentApi.getStats.mockResolvedValue({
    data: {
      success: true,
      data: {
        totalPages: 8,
        publishedPages: 5,
        draftPages: 2,
        archivedPages: 1,
        totalBanners: 5,
        activeBanners: 4,
        totalFaqs: 12,
        faqCategories: 6,
      },
    },
  } as any);

  mockedContentApi.listPages.mockResolvedValue({
    data: {
      success: true,
      data: [
        {
          id: 'p-1',
          title: 'About CodeVerse',
          slug: 'about-codeverse',
          page_type: 'page',
          category: 'Company',
          status: 'published',
          view_count: 1420,
          updated_at: '2026-11-15T00:00:00Z',
        },
        {
          id: 'p-2',
          title: 'Terms and Conditions',
          slug: 'terms-and-conditions',
          page_type: 'legal',
          category: 'Legal',
          status: 'published',
          view_count: 512,
          updated_at: '2026-11-15T00:00:00Z',
        },
      ],
      total: 2,
    },
  } as any);

  mockedContentApi.listBanners.mockResolvedValue({
    data: {
      success: true,
      data: [
        {
          id: 'b-1',
          title: 'Learn Coding from Industry Experts',
          subtitle: 'Live Masterclasses Every Weekend',
          description: 'Senior engineers cohort',
          cta_text: 'Explore Masterclasses',
          cta_url: '/courses/masterclasses',
          priority: 10,
          position: 'top',
          is_active: true,
        },
      ],
      total: 1,
    },
  } as any);

  mockedContentApi.listFaqs.mockResolvedValue({
    data: {
      success: true,
      data: [
        {
          id: 'f-1',
          question: 'How do I create and verify my CodeVerse account?',
          answer: 'You can sign up using email.',
          category: 'Account & Registration',
          display_order: 1,
          status: 'published',
        },
      ],
      total: 1,
    },
  } as any);
});

describe('SuperAdminContentPage Component Suite', () => {
  it('renders header, overview cards, and content pages table', async () => {
    renderPage();

    expect(screen.getByText('Content Management Hub')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('About CodeVerse')).toBeInTheDocument();
      expect(screen.getByText('/about-codeverse')).toBeInTheDocument();
      expect(screen.getByText('Terms and Conditions')).toBeInTheDocument();
    });
  });

  it('switches to Banners tab and displays promotional cards', async () => {
    renderPage();
    const user = userEvent.setup();

    const bannersTab = screen.getByRole('button', { name: /Promotional Banners/i });
    await user.click(bannersTab);

    await waitFor(() => {
      expect(screen.getByText('Learn Coding from Industry Experts')).toBeInTheDocument();
      expect(screen.getByText('Live Masterclasses Every Weekend')).toBeInTheDocument();
    });
  });

  it('switches to FAQs tab and displays questions', async () => {
    renderPage();
    const user = userEvent.setup();

    const faqsTab = screen.getByRole('button', { name: /FAQs/i });
    await user.click(faqsTab);

    await waitFor(() => {
      expect(screen.getByText('How do I create and verify my CodeVerse account?')).toBeInTheDocument();
      expect(screen.getByText('You can sign up using email.')).toBeInTheDocument();
    });
  });
});
