import React from 'react';
import Layout from './components/Layout';
import ChatWindow from './components/ChatWindow';
import { useChat } from './hooks/useChat';

function App() {
  const { messages, isLoading, error, sendMessage } = useChat();

  return (
    <Layout>
      <ChatWindow
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
        error={error}
      />
    </Layout>
  );
}

export default App;


