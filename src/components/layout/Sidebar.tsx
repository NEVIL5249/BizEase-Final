// import { useState } from 'react';
// import { NavLink, useLocation } from 'react-router-dom';
// import {
//   LayoutDashboard,
//   ShoppingCart,
//   Package,
//   Warehouse,
//   Users,
//   BookOpen,
//   Truck,
//   Receipt,
//   BarChart3,
//   Calculator,
//   Sparkles,
//   Settings,
//   ChevronLeft,
//   ChevronRight,
//   FileText,  
// } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';

// const navItems = [
//   { path: '/', label: 'Dashboard', icon: LayoutDashboard },
//   { path: '/sales', label: 'Sales', icon: ShoppingCart },
//   { path: '/estimate', label: 'Estimate', icon: FileText },
//   { path: '/ewaybill', label: 'E-Way Bill', icon: Truck },
//   { path: '/purchases', label: 'Purchases', icon: Package },
//   { path: '/inventory', label: 'Inventory', icon: Warehouse },
//   { path: '/customers', label: 'Customers', icon: Users },
//   { path: '/ledger', label: 'Customer Ledger', icon: BookOpen },
//   { path: '/supplier-ledger', label: 'Supplier Ledger', icon: Truck },
//   { path: '/expenses', label: 'Expenses', icon: Receipt },
//   { path: '/reports', label: 'Reports', icon: BarChart3 },
//   { path: '/gst', label: 'GST & Compliance', icon: Calculator },
//   { path: '/ai-insights', label: 'AI Insights', icon: Sparkles },
//   { path: '/settings', label: 'Settings', icon: Settings },
// ];

// export function Sidebar() {
//   const [collapsed, setCollapsed] = useState(false);
//   const location = useLocation();

//   return (
//     <aside
//       className={cn(
//         'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out',
//         collapsed ? 'w-[68px]' : 'w-[240px]'
//       )}
//     >
//       {/* Logo */}
//       <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
//             <span className="text-primary-foreground font-bold text-lg">B</span>
//           </div>
//           {!collapsed && (
//             <span className="font-semibold text-lg text-sidebar-foreground">BizEase</span>
//           )}
//         </div>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 py-4 px-2 overflow-y-auto">
//         <ul className="space-y-1">
//           {navItems.map((item) => {
//             const isActive = location.pathname === item.path;
//             return (
//               <li key={item.path}>
//                 <NavLink
//                   to={item.path}
//                   className={cn(
//                     'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
//                     isActive
//                       ? 'bg-sidebar-accent text-sidebar-accent-foreground'
//                       : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
//                   )}
//                 >
//                   <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
//                   {!collapsed && <span>{item.label}</span>}
//                 </NavLink>
//               </li>
//             );
//           })}
//         </ul>
//       </nav>

//       {/* Collapse Toggle */}
//       <div className="p-2 border-t border-sidebar-border">
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={() => setCollapsed(!collapsed)}
//           className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent"
//         >
//           {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
//         </Button>
//       </div>
//     </aside>
//   );
// }
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  BookOpen,
  Truck,
  Receipt,
  BarChart3,
  Calculator,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { 
    path: '/', 
    label: 'Dashboard', 
    icon: LayoutDashboard 
  },
  {
    label: 'Sales',
    icon: ShoppingCart,
    children: [
      { path: '/sales', label: 'Sales', icon: ShoppingCart },
      { path: '/estimate', label: 'Estimate', icon: FileText },
      { path: '/ewaybill', label: 'E-Way Bill', icon: Truck },
    ],
  },
  { 
    path: '/purchases', 
    label: 'Purchases', 
    icon: Package 
  },
  { 
    path: '/inventory', 
    label: 'Inventory', 
    icon: Warehouse 
  },
  { 
    path: '/customers', 
    label: 'Customers', 
    icon: Users 
  },
  {
    label: 'Ledger',
    icon: BookOpen,
    children: [
      { path: '/ledger', label: 'Customer Ledger', icon: Users },
      { path: '/supplier-ledger', label: 'Supplier Ledger', icon: Truck },
    ],
  },
  { 
    path: '/expenses', 
    label: 'Expenses', 
    icon: Receipt 
  },
  { 
    path: '/reports', 
    label: 'Reports', 
    icon: BarChart3 
  },
  { 
    path: '/gst', 
    label: 'GST & Compliance', 
    icon: Calculator 
  },
  { 
    path: '/ai-insights', 
    label: 'AI Insights', 
    icon: Sparkles 
  },
  { 
    path: '/settings', 
    label: 'Settings', 
    icon: Settings 
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Sales', 'Ledger']);
  const location = useLocation();

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isPathActive = (path: string) => location.pathname === path;

  const isParentActive = (children?: Array<{ path: string }>) => {
    if (!children) return false;
    return children.some((child) => location.pathname === child.path);
  };

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg text-sidebar-foreground">BizEase</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            // Parent item with children
            if (item.children) {
              const isExpanded = expandedItems.includes(item.label);
              const hasActiveChild = isParentActive(item.children);

              return (
                <li key={item.label}>
                  {/* Parent Button */}
                  <button
                    onClick={() => !collapsed && toggleExpanded(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      hasActiveChild
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0',
                        hasActiveChild && 'text-primary'
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>

                  {/* Children */}
                  {!collapsed && isExpanded && (
                    <ul className="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-2">
                      {item.children.map((child) => {
                        const isActive = isPathActive(child.path);
                        return (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                              )}
                            >
                              <child.icon
                                className={cn(
                                  'w-4 h-4 flex-shrink-0',
                                  isActive && 'text-primary'
                                )}
                              />
                              <span>{child.label}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            // Regular nav item
            const isActive = isPathActive(item.path!);
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path!}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon
                    className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}