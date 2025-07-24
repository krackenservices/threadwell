import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from '../components/Chat/MessageInput';

const noop = () => {};

describe('MessageInput', () => {
  it('submits message on Enter key', () => {
    const handleSend = vi.fn();
    render(
      <MessageInput onSend={handleSend} activeThreadId={null} clearThread={noop} />
    );
    const textarea = screen.getByPlaceholderText('Type a message…');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(handleSend).toHaveBeenCalledWith('Hello');
  });

  it('shows disabled state', () => {
    render(
      <MessageInput onSend={noop} activeThreadId={null} clearThread={noop} disabled />
    );
    const textarea = screen.getByPlaceholderText('Processing...') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
  });
});
