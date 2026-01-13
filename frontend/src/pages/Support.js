import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle, MessageSquare, Book, FileQuestion, ExternalLink,
  Search, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: 'How do I increase my node earnings?',
      answer: 'Install more apps from the App Factory, promote your referral links, and ensure your node maintains high uptime. Higher capacity nodes can run more apps simultaneously.'
    },
    {
      question: 'When do I receive payouts?',
      answer: 'Payouts are processed automatically every Friday. Your earnings are transferred directly to your connected wallet in OPT tokens.'
    },
    {
      question: 'What happens if my node goes offline?',
      answer: 'Short outages (under 1 hour) have minimal impact. Extended downtime affects your reliability score and may reduce your share of network rewards.'
    },
    {
      question: 'How do I upgrade my node capacity?',
      answer: 'Visit the Capacity & Upgrades page to view available plans. Upgrades are instant and allow you to install more revenue-generating apps.'
    },
    {
      question: 'What is the OPT token?',
      answer: 'OPT is the native token of the Optio Blockchain Cloud. All node earnings are paid in OPT, which can be traded on major exchanges or held for governance participation.'
    }
  ];

  const resources = [
    { title: 'Getting Started Guide', icon: Book, url: '#' },
    { title: 'API Documentation', icon: FileQuestion, url: '#' },
    { title: 'Community Discord', icon: MessageSquare, url: '#' },
    { title: 'Status Page', icon: ExternalLink, url: '#' }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-cyan-400" />
          Support
        </h1>
        <p className="text-slate-400 mt-1">Get help with your node operations</p>
      </div>

      {/* Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-black/40 border-white/10 text-white text-lg"
            data-testid="support-search"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="bg-white/5 rounded-xl border border-white/5 px-4"
              >
                <AccordionTrigger className="text-left text-white hover:text-cyan-400 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Resources & Contact */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Resources</h2>
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <a 
                  key={index}
                  href={resource.url}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <resource.icon className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
                    <span className="text-slate-300 group-hover:text-white">{resource.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold text-white font-['Outfit'] mb-4">Need More Help?</h2>
            <p className="text-slate-400 mb-4">
              Our support team is available 24/7 to help with any issues.
            </p>
            <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
