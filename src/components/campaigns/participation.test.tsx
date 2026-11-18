import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { ParticipationPanel } from './ParticipationPanel';
import { CampaignCard } from './CampaignCard';
import { campaign, participation } from '@/test/fixtures';
const callbacks = { onJoin: vi.fn(), onSignIn: vi.fn(), onLeave: vi.fn(), onRetry: vi.fn() };
it('offers a usable sign-in action and blocks resubmission after rejection', () => {
  const { rerender } = render(
    <MemoryRouter>
      <ParticipationPanel campaign={campaign} checking={false} joining={false} {...callbacks} />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Sign in to apply' }));
  expect(callbacks.onSignIn).toHaveBeenCalledTimes(1);
  rerender(
    <MemoryRouter>
      <ParticipationPanel
        campaign={campaign}
        userId="player"
        participation={{ ...participation, status: 'rejected' }}
        checking={false}
        joining={false}
        {...callbacks}
      />
    </MemoryRouter>,
  );
  expect(screen.queryByRole('button', { name: 'Apply to join' })).not.toBeInTheDocument();
  expect(screen.getByText('Your application was not accepted.')).toBeVisible();
});
it('keeps private links out of the UI for unauthorized users', () => {
  render(
    <MemoryRouter>
      <ParticipationPanel
        campaign={campaign}
        userId="player"
        privateUrl="https://discord.gg/private-party"
        checking={false}
        joining={false}
        {...callbacks}
      />
    </MemoryRouter>,
  );
  expect(screen.queryByRole('link', { name: 'Enter the Discord server' })).not.toBeInTheDocument();
});
it('uses a single semantic link and meaningful campaign metadata', () => {
  render(
    <MemoryRouter>
      <CampaignCard campaign={campaign} />
    </MemoryRouter>,
  );
  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAttribute('href', `/campaign/${campaign.id}`);
  expect(screen.getByText(campaign.title)).toBeVisible();
  expect(screen.getByText(campaign.schedule!)).toBeVisible();
  expect(screen.getByText('2 seats open')).toBeVisible();
});
