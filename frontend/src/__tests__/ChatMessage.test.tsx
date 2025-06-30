import { render, screen } from '@testing-library/react';
import ChatMessage from '../components/Chat/ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/types';

const baseMessage: ChatMessageType = {
  id: '1',
  thread_id: 't1',
  role: 'assistant',
  content: 'Hello world',
  timestamp: 0,
};

describe('ChatMessage', () => {
  it('renders message content', () => {
    render(<ChatMessage message={baseMessage} />);
    expect(screen.getByText('Assistant')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
