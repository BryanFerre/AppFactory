import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, Search, Filter, MoreVertical, Mail, Calendar, Shield, Ban, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await axios.get(`${API}/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/users/${userId}/suspend`, { reason: 'Admin action' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User suspended');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const handleReinstate = async (userId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/users/${userId}/reinstate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User reinstated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to reinstate user');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">Users & Accounts</h1>
        <p className="text-slate-400 mt-1">Manage user accounts and permissions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by name, email, or ID..."
            className="pl-10 bg-black/40 border-white/10 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-black/40 border-white/10">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0f111a] border-white/10">
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-[rgba(15,17,26,0.6)] border-white/10 hover:border-cyan-500/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold">{user.name?.charAt(0) || user.email?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={user.is_active !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                        {user.is_active !== false ? 'Active' : 'Suspended'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0f111a] border-white/10">
                          {user.is_active !== false ? (
                            <DropdownMenuItem onClick={() => handleSuspend(user.id)} className="text-red-400 cursor-pointer">
                              <Ban className="w-4 h-4 mr-2" /> Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleReinstate(user.id)} className="text-emerald-400 cursor-pointer">
                              <CheckCircle className="w-4 h-4 mr-2" /> Reinstate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {users.length === 0 && (
            <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-white">No users found</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
