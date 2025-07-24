import { render, screen } from '@testing-library/react';
import ChatThread from '../components/Chat/ChatThread';
import type { ChatMessage } from '@/types';

const messages: ChatMessage[] = [
  { id: '1', thread_id: 't1', role: 'user', content: 'Hello', timestamp: 0 },
  { id: '2', thread_id: 't1', role: 'assistant', parent_id: '1', content: 'Hi there', timestamp: 1 },
  { id: '3', thread_id: 't1', role: 'user', parent_id: '2', content: 'How are you?', timestamp: 2 }
];

const noop = () => {};

describe('ChatThread', () => {
  it('renders threaded messages', () => {
    render(<ChatThread messages={messages} onReply={noop} onMoveToChat={noop} activeThreadId={null} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
  });
});
