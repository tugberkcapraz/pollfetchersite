"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import ReportChat from "@/components/report-chat"

export default function ReportPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.report }]);
    } catch (error) {
      console.error('Error generating report:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while generating your report. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.h1
              className="text-3xl md:text-4xl font-display font-bold mb-6 px-1"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Generate <span className="gradient-text">Survey Reports</span>
            </motion.h1>
            
            <motion.p
              className="text-lg mb-8 text-starlight-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Ask a question about survey data and get a comprehensive report based on our database of polls.
            </motion.p>

            <div className="glass-panel p-6 rounded-xl mb-6">
              <ReportChat 
                messages={messages} 
                isLoading={isLoading} 
                messagesEndRef={messagesEndRef}
              />
              
              <form onSubmit={handleSendMessage} className="mt-4">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-elegant-gold-dark via-elegant-gold to-elegant-gold-light rounded-lg blur opacity-30 transition-opacity duration-300"></div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Ask a question about survey data..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isLoading}
                      className="elegant-input h-14 pl-5 pr-32 rounded-lg text-lg w-full"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="absolute right-2 h-10 px-6 bg-gradient-to-r from-elegant-gold-dark to-elegant-gold rounded-md font-medium text-elegant-blue-dark transition-transform duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <Send className="w-5 h-5 mr-2 inline-block" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
} 