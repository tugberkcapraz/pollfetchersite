"use client"

import React, { RefObject } from 'react'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'

interface ReportChatProps {
  messages: Array<{ role: 'user' | 'assistant', content: string }>;
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export default function ReportChat({ messages, isLoading, messagesEndRef }: ReportChatProps) {
  const renderMessageContent = (content: string, role: 'user' | 'assistant') => {
    if (role === 'user') {
      return <p className="whitespace-pre-wrap">{content}</p>;
    }
    
    // For assistant messages, apply blue color styling to markdown headings
    return (
      <div className="prose 
                    prose-headings:text-secondary
                    prose-h1:text-secondary
                    prose-h2:text-secondary
                    prose-h3:text-secondary
                    prose-p:text-gray-900 
                    prose-li:text-gray-900 
                    prose-strong:text-secondary
                    prose-a:text-blue-600
                    max-w-none">
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4 h-[50vh] overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-starlight-100 text-center">
          <div>
            <p className="mb-2 text-xl font-semibold">Ask about survey data</p>
            <p>Try questions like "What do people think about climate change?" or "Show me recent polls about healthcare"</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-elegant-gold bg-opacity-10 text-gray-900' 
                    : 'bg-elegant-blue-light bg-opacity-10 text-gray-900'
                }`}
              >
                {renderMessageContent(message.content, message.role)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-lg bg-elegant-blue-light bg-opacity-10 text-gray-900 flex items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <p>Generating report...</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
} 