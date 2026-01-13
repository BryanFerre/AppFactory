import React from 'react';
import { Settings, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit']">Admin Settings</h1>
        <p className="text-slate-400 mt-1">Configure admin panel settings and manage admin accounts</p>
      </div>
      <Card className="bg-[rgba(15,17,26,0.6)] border-white/10">
        <CardContent className="py-12 text-center">
          <Construction className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
          <p className="text-slate-400">Admin settings are under development</p>
        </CardContent>
      </Card>
    </div>
  );
}
