"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Check } from "lucide-react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import ReportChat from "@/components/report-chat"

// Model types that can be selected
type Model = 'azure' | 'gemini';

export default function ReportPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>('azure'); // Default to Azure
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add click-away handler for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    // Add event listener when dropdown is open
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
        body: JSON.stringify({ 
          query: userMessage,
          model: selectedModel // Include the selected model in the request
        }),
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

  // Toggle the dropdown menu
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Handle model selection
  const selectModel = (model: Model) => {
    setSelectedModel(model);
    setDropdownOpen(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-32 pb-16">
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
              {/* Model selection dropdown */}
              <div className="flex justify-end mb-4">
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={toggleDropdown}
                    className="px-4 py-2 text-sm bg-elegant-blue-dark rounded-md border border-elegant-gold/20 flex items-center"
                    disabled={isLoading}
                  >
                    <span>Model: </span>
                    <span className="font-medium ml-1">
                      {selectedModel === 'azure' ? 'Azure AI' : 'Gemini'}
                    </span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-elegant-blue-dark border border-elegant-gold/20 z-50">
                      <div className="py-1">
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-elegant-blue/50 flex items-center"
                          onClick={() => selectModel('azure')}
                        >
                          {selectedModel === 'azure' && <Check className="h-4 w-4 mr-2" />}
                          <span className={selectedModel === 'azure' ? 'ml-2' : 'ml-6'}>Azure AI</span>
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-elegant-blue/50 flex items-center"
                          onClick={() => selectModel('gemini')}
                        >
                          {selectedModel === 'gemini' && <Check className="h-4 w-4 mr-2" />}
                          <span className={selectedModel === 'gemini' ? 'ml-2' : 'ml-6'}>Gemini</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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