import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SuperAdminSupportPage from './page';
import { superAdminSupportApi, userApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  superAdminSupportApi: {
    getStatistics: vi.fn(),
    listTickets: vi.fn(),
    getTicket: vi.fn(),
    createTicket: vi.fn(),
    updateTicket: vi.fn(),
    deleteTicket: vi.fn(),
    getMessages: vi.fn(),
    reply: vi.fn(),
    addInternalNote: vi.fn(),
    getAgents: vi.fn(),
    assignTicket: vi.fn(),
    updateStatus: vi.fn(),
    updatePriority: vi.fn(),
    escalate: vi.fn(),
    reopen: vi.fn(),
    exportCSVUrl: vi.fn(() => '/export-csv'),
  },
  userApi: {
    list: vi.fn(),
  },
}));

const mockedSupportApi = vi.mocked(superAdminSupportApi);
const mockedUserApi = vi.mocked(userApi);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SuperAdminSupportPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mockedSupportApi.getStatistics.mockResolvedValue({
    data: {
      success: true,
      data: {
        totalTickets: 30,
        openTickets: 10,
        inProgressTickets: 8,
        resolvedTickets: 7,
        closedTickets: 5,
        resolvedOrClosedTickets: 12,
        urgentTickets: 5,
        overdueTickets: 2,
        averageFirstResponseTime: '2.4h',
        averageResolutionTime: '18.5h',
      },
    },
  } as any);

  mockedSupportApi.listTickets.mockResolvedValue({
    data: {
      success: true,
      data: {
        items: [
          {
            id: 'tck-1',
            ticket_number: 'TCK-2026-0001',
            subject: 'Unable to log in to student dashboard',
            category: 'Account Issue',
            priority: 'high',
            status: 'open',
            user_name: 'Aarav Mehta',
            user_email: 'aarav@example.com',
            user_role: 'general_student',
            institution_name: 'Apex Institute',
            assigned_to_name: 'Vikram Malhotra',
            department: 'Customer Success',
            created_at: '2026-11-14T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  } as any);

  mockedSupportApi.getTicket.mockResolvedValue({
    data: {
      success: true,
      data: {
        id: 'tck-1',
        ticket_number: 'TCK-2026-0001',
        subject: 'Unable to log in to student dashboard',
        category: 'Account Issue',
        priority: 'high',
        status: 'open',
        user_name: 'Aarav Mehta',
        user_email: 'aarav@example.com',
        user_role: 'general_student',
        institution_name: 'Apex Institute',
        assigned_to_name: 'Vikram Malhotra',
        department: 'Customer Success',
        created_at: '2026-11-14T00:00:00Z',
        messages: [
          {
            id: 'msg-1',
            message: 'Original student issue report.',
            sender_name: 'Aarav Mehta',
            sender_role: 'general_student',
            message_type: 'USER_REPLY',
            is_internal: false,
            created_at: '2026-11-14T00:00:00Z',
          },
        ],
        activities: [],
      },
    },
  } as any);

  mockedSupportApi.getAgents.mockResolvedValue({
    data: {
      success: true,
      data: [
        { id: 'ag-1', name: 'Vikram Malhotra', email: 'vikram@codeverse.dev', role: 'super_admin', active_tickets_count: 3 },
      ],
    },
  } as any);

  mockedUserApi.list.mockResolvedValue({
    data: {
      success: true,
      data: [
        { id: 'usr-1', name: 'Aarav Mehta', email: 'aarav@example.com', role: 'general_student' },
      ],
    },
  } as any);
});

describe('SuperAdminSupportPage Component Suite', () => {
  it('renders header, 4 statistics cards, and ticket list', async () => {
    renderPage();

    expect(screen.getByText('Support Ticket Help Desk')).toBeInTheDocument();
    expect(
      screen.getByText('Platform-wide customer queries, instructor requests, bug reports, and resolution threads')
    ).toBeInTheDocument();

    // Verify statistics cards
    const countElements = await screen.findAllByText('30');
    expect(countElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Total Tickets')).toBeInTheDocument();
    expect(screen.getAllByText('Open Tickets').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Resolved / Closed')).toBeInTheDocument();

    // Verify ticket row
    expect(await screen.findByText('TCK-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Unable to log in to student dashboard')).toBeInTheDocument();
    expect(screen.getByText('Aarav Mehta')).toBeInTheDocument();
  });

  it('filters by status when clicking status tabs', async () => {
    renderPage();
    await screen.findByText('TCK-2026-0001');

    const openFilter = screen.getByRole('button', { name: /Open/i });
    await userEvent.click(openFilter);

    await waitFor(() => {
      expect(mockedSupportApi.listTickets).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'open' })
      );
    });
  });

  it('opens details drawer when clicking "Details" button', async () => {
    renderPage();
    await screen.findByText('TCK-2026-0001');

    const detailsBtn = screen.getByTitle('View Details & Reply');
    await userEvent.click(detailsBtn);

    expect(await screen.findByText('Requester Profile')).toBeInTheDocument();
    expect(screen.getByText('Original student issue report.')).toBeInTheDocument();
    expect(screen.getByText('Public Reply')).toBeInTheDocument();
    expect(screen.getByText('Internal Note')).toBeInTheDocument();
  });

  it('opens assignment modal when clicking "Assign" button', async () => {
    renderPage();
    await screen.findByText('TCK-2026-0001');

    const assignBtn = screen.getByTitle('Assign Agent');
    await userEvent.click(assignBtn);

    expect(await screen.findByText('Assign Ticket')).toBeInTheDocument();
    expect(screen.getByText('Select Support Agent')).toBeInTheDocument();
    expect(screen.getByText('Confirm Assignment')).toBeInTheDocument();
  });

  it('opens create ticket modal when clicking "File Ticket"', async () => {
    renderPage();
    await screen.findByText('TCK-2026-0001');

    const fileTicketBtn = screen.getByRole('button', { name: /File Ticket/i });
    await userEvent.click(fileTicketBtn);

    expect(await screen.findByText('Create Support Ticket')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Unable to submit assignment in lab 3')).toBeInTheDocument();
  });
});
