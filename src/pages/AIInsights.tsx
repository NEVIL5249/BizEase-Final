import { Sparkles, MessageSquare, TrendingDown, Package, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const mockInsights = [
  { icon: TrendingDown, title: 'Profit Margin Alert', message: 'Wall Putty 40kg has only 8% margin. Consider price adjustment.', type: 'warning' },
  { icon: Package, title: 'Reorder Suggestion', message: 'White Cement 1kg stock is low. Suggested reorder: 50 units based on sales velocity.', type: 'info' },
  { icon: CreditCard, title: 'Payment Follow-up', message: 'Shree Krishna Enterprises has ₹42,300 outstanding for 45+ days.', type: 'warning' },
];

export function AIInsights() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; message: string }[]>([]);

  const handleAsk = () => {
    if (!query.trim()) return;
    setChatHistory([...chatHistory, { role: 'user', message: query }, { role: 'ai', message: `Based on your data analysis: Your ${query.toLowerCase().includes('profit') ? 'profit margins are healthy at 18% average. Top performers are Steel and Cement categories.' : query.toLowerCase().includes('stock') ? 'inventory shows 2 items need immediate reorder: Wall Putty and White Cement.' : 'business metrics look stable. Sales are up 12% compared to last month.'}` }]);
    setQuery('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Business Insights</h1>
        <p className="text-muted-foreground mt-1">Get intelligent insights about your business</p>
      </div>

      <Card className="card-elevated p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Ask anything about your business</h3>
            <p className="text-sm text-muted-foreground">Powered by AI (Demo Mode)</p>
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto mb-4">
          {chatHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Try asking: "Why is profit down?" or "Which items should I reorder?"</p>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask about sales, inventory, payments..." onKeyDown={(e) => e.key === 'Enter' && handleAsk()} />
          <Button onClick={handleAsk} className="btn-gradient"><MessageSquare className="w-4 h-4" /></Button>
        </div>
      </Card>

      <div>
        <h3 className="font-semibold text-foreground mb-4">Auto-Generated Insights</h3>
        <div className="grid gap-4">
          {mockInsights.map((insight, i) => (
            <Card key={i} className={`card-elevated p-4 border-l-4 ${insight.type === 'warning' ? 'border-l-warning' : 'border-l-info'}`}>
              <div className="flex items-start gap-3">
                <insight.icon className={`w-5 h-5 mt-0.5 ${insight.type === 'warning' ? 'text-warning' : 'text-info'}`} />
                <div>
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
