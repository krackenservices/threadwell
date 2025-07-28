import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Plus, Search, Settings, User, Menu, X, Reply, GitBranch } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import type { ChatMessage } from '@/types';

/**
 * FancyThreadWell reimplements the threaded chat UI from the demo snippet
 * but delegates data fetching and message actions to the existing useChat hook.
 */
const FancyThreadWell: React.FC = () => {
  const {
    threads,
    currentThreadId,
    messages,
    activeThreadId,
    handleSend,
    handleNewChat,
    handleReply,
    handleMoveToChat,
    handleSetCurrentThreadId,
  } = useChat();

  const currentThread = threads.find(t => t.id === currentThreadId) || null;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string, parentId: string | null) => {
    if (!content.trim() || !currentThreadId) return;
    if (parentId) {
      handleReply(parentId);
    }
    await handleSend(content);
    setNewMessage('');
    setReplyingTo(null);
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

  const getMessageById = (id: string) => messages.find(m => m.id === id);
  const getChildren = (id: string) => messages.filter(m => m.parent_id === id);
  const getMessageDepth = (id: string): number => {
    const msg = getMessageById(id);
    if (!msg || !msg.parent_id) return 0;
    let depth = 1;
    let parent = getMessageById(msg.parent_id);
    while (parent && parent.parent_id) {
      depth++;
      parent = getMessageById(parent.parent_id);
    }
    return depth;
  };
  const getAncestors = (id: string): string[] => {
    const ancestors: string[] = [];
    let current: ChatMessage | undefined = getMessageById(id);
    while (current && current.parent_id) {
      current = getMessageById(current.parent_id);
      if (current) ancestors.push(current.id);
    }
    return ancestors;
  };
  const [activeThreadPath, setActiveThreadPath] = useState<string[]>([]);
  useEffect(() => {
    if (activeThreadId) {
      const ancestors = getAncestors(activeThreadId);
      setActiveThreadPath([activeThreadId, ...ancestors]);
    } else {
      setActiveThreadPath([]);
    }
  }, [activeThreadId, messages]);
  const isActiveInThread = (id: string) => activeThreadPath.includes(id) || replyingTo === id;

  const rootMessages = messages.filter(m => !m.parent_id);

  const MessageBubble: React.FC<{ message: ChatMessage; isRoot?: boolean }> = ({ message, isRoot }) => {
    const depth = getMessageDepth(message.id);
    const marginLeft = depth * 32;
    const children = getChildren(message.id);
    const isReplying = replyingTo === message.id;
    const isActive = isActiveInThread(message.id);
    return (
      <div className="relative" style={{ marginLeft: isRoot ? 0 : marginLeft }}>
        {depth > 0 && (
          <>
            <div className={`absolute top-0 bottom-0 w-0.5 ${isActive ? 'bg-blue-400' : 'bg-gray-300'} -left-4`} style={{ marginLeft: 16 }} />
            <div className={`absolute top-6 w-4 h-0.5 ${isActive ? 'bg-blue-400' : 'bg-gray-300'} -left-4`} style={{ marginLeft: 16 }} />
          </>
        )}
        <div className="flex items-start space-x-3 mb-4">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            depth === 0 ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
            depth === 1 ? 'bg-gradient-to-br from-green-500 to-teal-600' :
            depth === 2 ? 'bg-gradient-to-br from-orange-500 to-red-600' :
            'bg-gradient-to-br from-gray-500 to-gray-700'
          }`}>
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`bg-white rounded-lg shadow-sm border-2 p-4 hover:shadow-md transition-all ${
              isActive ? 'border-blue-300 shadow-md' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{message.role}</span>
                  <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                  {depth > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      L{depth}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleMoveToChat(message.id)}
                    className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
                    title="Fork thread from here"
                  >
                    <GitBranch className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === message.id ? null : message.id);
                      handleReply(message.id);
                    }}
                    className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                    title="Reply to this message"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
            </div>
            {isReplying && (
              <div className="mt-3 ml-4">
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => sendMessage(newMessage, message.id)}
                    disabled={!newMessage.trim()}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {children.length > 0 && (
              <div className="mt-3 space-y-4">
                {children.map(child => (
                  <MessageBubble key={child.id} message={child} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filteredThreads = threads.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col shadow-lg`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-blue-500" />
              ThreadWell
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Thread</span>
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search threads..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pb-4 space-y-3">
            {filteredThreads.map(thread => (
              <div
                key={thread.id}
                onClick={() => {
                  handleSetCurrentThreadId(thread.id);
                  setReplyingTo(null);
                }}
                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  currentThreadId === thread.id ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md' : 'hover:bg-gray-50 border-transparent border hover:border-gray-200'
                }`}
              >
                <div className="font-semibold text-gray-900 truncate mb-2">{thread.title === 'New Thread' ? `Chat ${thread.id.slice(4,8)}` : thread.title}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors w-full p-3 rounded-lg hover:bg-gray-50">
            <Settings className="w-4 h-4" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-gray-600 lg:hidden">
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  {currentThread?.title}
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {messages.length} messages
                  </span>
                </h2>
                {currentThread && (
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated {formatDate(currentThread.created_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
                  <MessageCircle className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Start a new conversation</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  This thread is empty. Start the conversation by sending your first message to begin organizing your thoughts.
                </p>
                <button
                  onClick={() => document.querySelector('textarea')?.focus()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  Start Conversation
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                {rootMessages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} isRoot />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="bg-white border-t border-gray-200 p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={replyingTo ? `Replying to ${getMessageById(replyingTo)?.role || 'unknown'}...` : 'Type your message...'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                  rows={3}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(newMessage, replyingTo);
                    }
                  }}
                />
              </div>
              <button
                onClick={() => sendMessage(newMessage, replyingTo)}
                disabled={!newMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center space-x-2 font-medium"
              >
                <span>Send</span>
              </button>
            </div>
            {replyingTo && (
              <div className="mt-3 text-sm text-gray-500 flex items-center">
                <span>Replying to: <span className="font-medium">{getMessageById(replyingTo)?.role || 'Unknown'}</span></span>
                <button onClick={() => setReplyingTo(null)} className="ml-3 text-blue-500 hover:text-blue-700 font-medium">Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FancyThreadWell;
