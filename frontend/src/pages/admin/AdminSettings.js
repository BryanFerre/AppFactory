import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Settings, Shield, Users, Plus, Mail, Lock, Trash2, CheckCircle,
  AlertTriangle, Key, UserPlus, Edit2, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/admin`;

const roleConfig = {
  super_admin: { color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-black', label: 'Super Admin' },
  support: { color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', label: 'Support' },
  finance: { color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: 'Finance' },
  compliance: { color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30', label: 'Compliance' },
  app_review: { color: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30', label: 'App Review' }
};

const availableRoles = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full access to all features' },
  { value: 'support', label: 'Support', description: 'Manage tickets and user issues' },
  { value: 'finance', label: 'Finance', description: 'Access billing and revenue data' },
  { value: 'compliance', label: 'Compliance', description: 'Audit logs and compliance reports' },
  { value: 'app_review', label: 'App Review', description: 'Review and approve app submissions' }
];

export default function AdminSettings() {
  const { admin } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '', password: '', role: 'support' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data.admins || []);
    } catch (error) {
      // If endpoint doesn't exist, show current admin only
      if (admin) {
        setAdmins([admin]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.name || !newAdmin.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/auth/create`, newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Admin account created successfully');
      setCreateDialog(false);
      setNewAdmin({ email: '', name: '', password: '', role: 'support' });
      fetchAdmins();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create admin'));
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">Admin Settings</h1>
          <p className="text-slate-400 mt-1">Configure admin panel settings and manage admin accounts</p>
        </div>
        {isSuperAdmin && (
          <Button 
            onClick={() => setCreateDialog(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        )}
      </div>

      {/* Current Admin Profile */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {admin?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{admin?.name}</h3>
              <p className="text-slate-400">{admin?.email}</p>
              <Badge className={`mt-2 ${roleConfig[admin?.role]?.color || 'bg-slate-500/20 text-slate-400'}`}>
                {roleConfig[admin?.role]?.label || admin?.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Accounts */}
      <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-['Outfit'] flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Admin Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((adminUser) => (
                <motion.div
                  key={adminUser.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {adminUser.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{adminUser.name}</p>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {adminUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={roleConfig[adminUser.role]?.color || 'bg-slate-500/20 text-slate-400'}>
                      {roleConfig[adminUser.role]?.label || adminUser.role}
                    </Badge>
                    {adminUser.id === admin?.id && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        You
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-['Outfit'] flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-slate-400">Add an extra layer of security</p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Coming Soon
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Session Management</p>
                <p className="text-sm text-slate-400">Manage active sessions</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3 mr-1" /> Active
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">Audit Logging</p>
                <p className="text-sm text-slate-400">All admin actions are logged</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3 mr-1" /> Enabled
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="bg-[#0f111a] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-['Outfit'] text-xl flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Add New Admin
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new admin account with specific role permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Full Name <span className="text-red-400">*</span></Label>
              <Input
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                placeholder="John Doe"
                className="bg-black/40 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email <span className="text-red-400">*</span></Label>
              <Input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="admin@optio.com"
                className="bg-black/40 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Password <span className="text-red-400">*</span></Label>
              <Input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                placeholder="••••••••"
                className="bg-black/40 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Role</Label>
              <Select value={newAdmin.role} onValueChange={(v) => setNewAdmin({ ...newAdmin, role: v })}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f111a] border-white/10">
                  {availableRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <p>{role.label}</p>
                        <p className="text-xs text-slate-500">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateAdmin}
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
