import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Sparkles, Clock, MapPin, ShoppingCart, Car, Truck } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AIAssistantWidgetProps {
  context?: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support';
  className?: string;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ 
  context, 
  className = '' 
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const { sendMessage, conversation, loading, getQuickSuggestions } = useAIAssistant(context);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    try {
      await sendMessage(inputMessage);
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    try {
      await sendMessage(question);
    } catch (error) {
      console.error('Error sending quick question:', error);
    }
  };

  const getContextIcon = () => {
    switch (context) {
      case 'transport': return <Car className="h-4 w-4" />;
      case 'delivery': return <Truck className="h-4 w-4" />;
      case 'marketplace': return <ShoppingCart className="h-4 w-4" />;
      case 'rental': return <Car className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getContextTitle = () => {
    switch (context) {
      case 'transport': return 'TAGA AI - Transport';
      case 'delivery': return 'TAGA AI - Livraison';
      case 'marketplace': return 'TAGA AI';
      case 'rental': return 'TAGA AI - Location';
      case 'support': return 'TAGA AI - Support';
      default: return 'TAGA AI';
    }
  };

  const suggestions = getQuickSuggestions(context);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderFunctionResult = (result: any) => {
    if (!result) return null;

    // PHASE 3: Product comparison
    if (result.type === 'product_comparison' && result.products) {
      return (
        <div className="mt-2 space-y-2">
          <p className="text-xs font-medium text-foreground">Comparaison:</p>
          <div className="grid grid-cols-2 gap-2">
            {result.products.map((product: any, idx: number) => (
              <div 
                key={idx} 
                className={cn(
                  "p-2 rounded-lg border text-xs",
                  product.id === result.recommendation?.bestValueId 
                    ? "bg-primary/10 border-primary" 
                    : "bg-muted/50 border-border"
                )}
              >
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.title}
                    className="w-full h-20 object-cover rounded mb-1"
                  />
                )}
                <p className="font-bold text-foreground truncate">{product.title}</p>
                <p className="font-bold text-primary">{product.price} {product.currency}</p>
                <p className="text-muted-foreground">⭐ {product.rating.toFixed(1)} ({product.reviews})</p>
                <p className={cn(
                  "font-medium mt-1",
                  product.stock > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
                </p>
                {product.id === result.recommendation?.bestValueId && (
                  <Badge className="mt-1 text-[10px] h-4">🏆 Best Value</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // PHASE 4: Image analysis
    if (result.type === 'image_analysis') {
      return (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-medium text-foreground">Analyse image:</p>
          {result.image_url && (
            <img 
              src={result.image_url} 
              alt="Produit"
              className="w-full max-h-32 object-cover rounded"
            />
          )}
          <div className="p-2 bg-muted/50 rounded text-xs text-foreground">
            {result.description}
          </div>
        </div>
      );
    }

    // PHASE 5: Seller reliability
    if (result.type === 'seller_reliability') {
      const { seller, trustScore, trustBadge, trustLevel, breakdown } = result;
      return (
        <div className="mt-2 p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-medium text-foreground">{seller.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {seller.totalSales} ventes • ⭐ {seller.rating.toFixed(1)}
              </p>
            </div>
            <div className="text-xl">{trustBadge}</div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-xs font-medium text-foreground">{trustLevel}</span>
              <span className="text-xs font-bold text-primary">{trustScore}/100</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary rounded-full h-1.5 transition-all"
                style={{ width: `${trustScore}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <div className="p-1 bg-background/50 rounded">
              <p className="text-muted-foreground">Note: {breakdown.rating}/40</p>
            </div>
            <div className="p-1 bg-background/50 rounded">
              <p className="text-muted-foreground">Vérif: {breakdown.verification}/20</p>
            </div>
          </div>
        </div>
      );
    }

    // PHASE 1: Stock availability
    if (result.type === 'stock_check') {
      return (
        <div className={cn(
          "mt-2 p-2 rounded border text-xs",
          result.alert 
            ? "bg-destructive/10 border-destructive" 
            : "bg-green-50 dark:bg-green-900/10 border-green-500"
        )}>
          <p className="font-medium text-foreground">{result.title}</p>
          <p className={cn(
            "font-bold",
            result.alert ? "text-destructive" : "text-green-600"
          )}>
            {result.status}
          </p>
        </div>
      );
    }

    // PHASE 1: Delivery cost
    if (result.type === 'delivery_cost') {
      return (
        <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
          <p className="text-foreground mb-1">{result.product_title}</p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Livraison:</span>
            <span className="font-bold text-primary">
              {result.totalCost} {result.currency}
            </span>
          </div>
        </div>
      );
    }

    if (result.type === 'destinations' && result.recommendations) {
      return (
        <div className="mt-2 p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Destinations recommandées
          </h4>
          {result.recommendations.map((dest: any, index: number) => (
            <div key={index} className="flex items-center gap-2 py-1">
              <span className="text-sm">{dest.destination_address}</span>
            </div>
          ))}
        </div>
      );
    }

    if (result.type === 'products' && result.recommendations) {
      return (
        <div className="mt-2 p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Produits recommandés
          </h4>
          {result.recommendations.map((product: any, index: number) => (
            <div key={index} className="flex items-center justify-between py-1">
              <span className="text-sm">{product.title}</span>
              <Badge variant="secondary">{product.price} CDF</Badge>
            </div>
          ))}
        </div>
      );
    }

    if (result.estimatedPrice) {
      return (
        <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="font-medium">Prix estimé:</span>
            <Badge className="bg-primary text-primary-foreground">
              {result.estimatedPrice} {result.currency}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Distance: ~{result.estimatedDistance} km
          </div>
        </div>
      );
    }

    if (result.driversFound !== undefined) {
      return (
        <div className="mt-2 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            <span className="font-medium">
              {result.driversFound} chauffeur(s) disponible(s)
            </span>
          </div>
        </div>
      );
    }

    if (result.productsFound !== undefined) {
      return (
        <div className="mt-2 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="font-medium">
              {result.productsFound} produit(s) trouvé(s)
            </span>
          </div>
          {result.products && result.products.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.products.slice(0, 3).map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{product.title}</span>
                  <Badge variant="outline">{product.price} CDF</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={`w-full max-w-md mx-auto h-[500px] flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getContextIcon()}
          {getContextTitle()}
          <Sparkles className="h-4 w-4 text-primary ml-auto" />
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
        {/* Conversation Area */}
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-3">
            {conversation.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-muted-foreground py-8"
              >
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Bonjour ! Je suis TAGA AI, votre assistant intelligent.
                  <br />
                  Comment puis-je vous aider aujourd'hui ?
                </p>
              </motion.div>
            )}

            <AnimatePresence>
              {conversation.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.functionResult && renderFunctionResult(message.functionResult)}
                    <div className="flex items-center gap-1 mt-1 opacity-70">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    TAGA AI réfléchit...
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Suggestions */}
        {conversation.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <p className="text-xs text-muted-foreground font-medium">Questions rapides:</p>
            <div className="flex flex-wrap gap-1">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleQuickQuestion(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};