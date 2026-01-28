import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { Building2, Sun, Moon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Settings() {
  const { company } = useApp();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your business settings</p>
      </div>

      <div className="grid gap-6">
        <Card className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Company Profile</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Company Name</Label><Input value={company?.name || ''} readOnly className="mt-1" /></div>
            <div><Label>GSTIN</Label><Input value={company?.gstin || ''} readOnly className="mt-1" /></div>
            <div className="md:col-span-2"><Label>Address</Label><Input value={company?.address || ''} readOnly className="mt-1" /></div>
            <div><Label>City</Label><Input value={company?.city || ''} readOnly className="mt-1" /></div>
            <div><Label>State</Label><Input value={company?.state || ''} readOnly className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={company?.phone || ''} readOnly className="mt-1" /></div>
            <div><Label>Email</Label><Input value={company?.email || ''} readOnly className="mt-1" /></div>
          </div>
          <Button className="mt-4 btn-gradient">Edit Profile</Button>
        </Card>

        <Card className="card-elevated p-6">
          <h3 className="font-semibold text-lg mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
            </div>
            <Button variant="outline" onClick={toggleTheme} className="gap-2">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
          </div>
        </Card>

        <Card className="card-elevated p-6">
          <h3 className="font-semibold text-lg mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Bank Name</Label><Input value={company?.bankName || ''} readOnly className="mt-1" /></div>
            <div><Label>Account Number</Label><Input value={company?.bankAccount || ''} readOnly className="mt-1" /></div>
            <div><Label>IFSC Code</Label><Input value={company?.ifscCode || ''} readOnly className="mt-1" /></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
