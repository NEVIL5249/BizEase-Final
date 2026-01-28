import { Bell, Moon, Sun, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { alerts, markAlertRead } = useApp();
  
  const unreadAlerts = alerts.filter(a => !a.isRead);
  const today = new Date();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{format(today, 'EEEE')}</span>
          <span className="mx-1.5">•</span>
          <span>{format(today, 'dd MMMM yyyy')}</span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices, customers, items..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {unreadAlerts.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-secondary">
                  {unreadAlerts.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b">
              <h4 className="font-semibold text-sm">Notifications</h4>
            </div>
            {unreadAlerts.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              unreadAlerts.slice(0, 5).map((alert) => (
                <DropdownMenuItem
                  key={alert.id}
                  onClick={() => markAlertRead(alert.id)}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                >
                  <span className="font-medium text-sm">{alert.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">{alert.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center ml-2">
          <span className="text-sm font-medium text-accent-foreground">KT</span>
        </div>
      </div>
    </header>
  );
}
