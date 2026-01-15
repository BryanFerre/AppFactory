import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  HelpCircle, MessageSquare, Book, FileQuestion, ExternalLink,
  Search, ChevronRight, Send, Loader2, CheckCircle, Clock, X,
  Ticket, Code, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    category: 'general'
  });

  const faqs = [
    {
      question: 'How do I increase my node earnings?',
      answer: 'Install more apps from the App Marketplace, promote your referral links, and ensure your node maintains high uptime. Higher capacity nodes can run more apps simultaneously.'
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
    { title: 'API Documentation', icon: Code, url: '#', action: () => setShowApiDocs(true) },
    { title: 'Community Discord', icon: MessageSquare, url: '#' },
    { title: 'Status Page', icon: ExternalLink, url: '#' }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'account', label: 'Account Issues' },
    { value: 'feature', label: 'Feature Request' }
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/support/tickets`, ticketForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Support ticket created successfully!');
      setShowTicketDialog(false);
      setTicketForm({ subject: '', message: '', category: 'general' });
      fetchTickets();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create ticket'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30"><Loader2 className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>;
    }
  };

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
                <button 
                  key={index}
                  onClick={resource.action || (() => {})}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <resource.icon className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
                    <span className="text-slate-300 group-hover:text-white">{resource.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                </button>
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
            <Button 
              onClick={() => setShowTicketDialog(true)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full"
              data-testid="contact-support-btn"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </motion.div>
        </div>
      </div>

      {/* My Tickets Section */}
      {tickets.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white font-['Outfit'] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-cyan-400" />
              My Support Tickets
            </h2>
            <Badge className="bg-white/10 text-slate-300">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</Badge>
          </div>
          
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id}
                className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-white truncate">{ticket.subject}</h3>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                      <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="bg-[#0f111a] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              Create Support Ticket
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Describe your issue and our team will get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitTicket} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Category</Label>
              <Select
                value={ticketForm.category}
                onValueChange={(value) => setTicketForm({ ...ticketForm, category: value })}
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white" data-testid="ticket-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f111a] border-white/10">
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Subject *</Label>
              <Input
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder="Brief description of your issue"
                className="bg-black/40 border-white/10 text-white"
                required
                data-testid="ticket-subject"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Message *</Label>
              <Textarea
                value={ticketForm.message}
                onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                placeholder="Please provide as much detail as possible about your issue..."
                className="bg-black/40 border-white/10 text-white min-h-[120px]"
                required
                data-testid="ticket-message"
              />
            </div>
          </form>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTicketDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitTicket}
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              data-testid="submit-ticket-btn"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Documentation Dialog */}
      <Dialog open={showApiDocs} onOpenChange={setShowApiDocs}>
        <DialogContent className="bg-[#0f111a] border-white/10 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <Code className="w-5 h-5 text-cyan-400" />
              API Documentation
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Public API endpoints for third-party integrations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Points API */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Activity Points API</h3>
              <p className="text-sm text-slate-400">
                Retrieve user points and activity data for your integrations.
              </p>
              
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400">GET</Badge>
                  <code className="text-cyan-400 text-sm">/api/external/points</code>
                </div>
                <p className="text-sm text-slate-400 mb-3">Returns points information for all users (public endpoint).</p>
                
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Response Example:</p>
                  <pre className="bg-black/60 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
{`{
  "users": [
    {
      "user_id": "abc123",
      "total_points": 1250,
      "level": "Gold",
      "rank": 15
    }
  ],
  "total_users": 1,
  "last_updated": "2024-01-15T10:30:00Z"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Node Stats API */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Node Statistics API</h3>
              <p className="text-sm text-slate-400">
                Access node health and performance metrics.
              </p>
              
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400">GET</Badge>
                  <code className="text-cyan-400 text-sm">/api/node/stats</code>
                </div>
                <p className="text-sm text-slate-400 mb-3">Returns current node health and performance data. Requires authentication.</p>
                
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Headers:</p>
                  <pre className="bg-black/60 rounded-lg p-3 text-xs text-slate-300">
{`Authorization: Bearer <your_token>`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Authentication */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Authentication</h3>
              <p className="text-sm text-slate-400">
                Most API endpoints require authentication via JWT token.
              </p>
              
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-amber-500/20 text-amber-400">POST</Badge>
                  <code className="text-cyan-400 text-sm">/api/auth/login</code>
                </div>
                <p className="text-sm text-slate-400 mb-3">Obtain an authentication token.</p>
                
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Request Body:</p>
                  <pre className="bg-black/60 rounded-lg p-3 text-xs text-slate-300">
{`{
  "email": "your@email.com",
  "password": "your_password"
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <p className="text-sm text-cyan-200">
                Need more API access or have questions? Contact our developer support team.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowApiDocs(false)} className="bg-cyan-500 hover:bg-cyan-400 text-black">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
