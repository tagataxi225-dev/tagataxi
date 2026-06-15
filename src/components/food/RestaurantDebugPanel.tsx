import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface RestaurantDebugPanelProps {
  selectedCity: string;
}

interface DebugData {
  restaurants: any[];
  products: any[];
}

export const RestaurantDebugPanel = ({ selectedCity }: RestaurantDebugPanelProps) => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testRestaurantId, setTestRestaurantId] = useState<string | null>(null);
  const [testProducts, setTestProducts] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  
  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      console.log(`[${timestamp}] 🐛 Debug Panel: Fetching data for city:`, selectedCity);
      
      // Requête directe sans cache
      const { data: restaurants, error: restError } = await supabase
        .from('restaurant_profiles')
        .select('id, restaurant_name, city, is_active, verification_status')
        .eq('city', selectedCity.trim())
        .eq('is_active', true);
      
      if (restError) throw restError;
      
      const { data: products, error: prodError } = await supabase
        .from('food_products')
        .select('id, name, restaurant_id, moderation_status, is_available, price, category')
        .eq('moderation_status', 'approved')
        .eq('is_available', true);
      
      if (prodError) throw prodError;
      
      console.log(`[${timestamp}] 🐛 Debug Panel: Data fetched:`, {
        restaurants: restaurants?.length,
        products: products?.length
      });
      
      setDebugData({ 
        restaurants: restaurants || [], 
        products: products || [] 
      });
    } catch (error) {
      console.error('Debug fetch error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const testFetchProducts = async (restaurantId: string) => {
    setTestRestaurantId(restaurantId);
    setTestLoading(true);
    const timestamp = Date.now();
    
    console.log(`[${timestamp}] 🧪 Testing product fetch for restaurant:`, restaurantId);
    
    try {
      const { data, error } = await supabase
        .from('food_products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('moderation_status', 'approved')
        .eq('is_available', true);
      
      console.log(`[${timestamp}] 🧪 Test result:`, {
        restaurantId,
        count: data?.length,
        products: data,
        error
      });
      
      setTestProducts(data || []);
    } catch (error) {
      console.error('Test fetch error:', error);
      setTestProducts([]);
    } finally {
      setTestLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDebugData();
  }, [selectedCity]);
  
  // Only show in development mode
  if (!import.meta.env.DEV) return null;
  
  const totalProducts = debugData?.products?.length || 0;
  const restaurantCount = debugData?.restaurants?.length || 0;
  
  return (
    <Card className="m-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="font-bold text-yellow-900 dark:text-yellow-200">🐛 Debug Panel</h3>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={fetchDebugData}
          disabled={loading}
          className="border-yellow-300 dark:border-yellow-700"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="text-sm space-y-3 text-yellow-900 dark:text-yellow-100">
        <div className="flex items-center gap-2">
          <strong>Ville:</strong> 
          <Badge variant="secondary">{selectedCity}</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 bg-white dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs text-muted-foreground">Restaurants actifs</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{restaurantCount}</div>
          </div>
          <div className="p-2 bg-white dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs text-muted-foreground">Produits approuvés</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalProducts}</div>
          </div>
        </div>
        
        {debugData && restaurantCount > 0 && (
          <div className="space-y-2 mt-4">
            <strong className="text-xs uppercase tracking-wide">Détails restaurants:</strong>
            {debugData.restaurants.map((r) => {
              const restaurantProducts = debugData.products.filter(p => p.restaurant_id === r.id);
              const productCount = restaurantProducts.length;
              const isTestingThis = testRestaurantId === r.id;
              
              return (
                <div 
                  key={r.id} 
                  className="pl-3 py-2 border-l-2 border-yellow-400 dark:border-yellow-600 bg-white dark:bg-yellow-900/20 rounded-r"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{r.restaurant_name}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {r.id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ville: {r.city} | Status: {r.verification_status}
                      </div>
                      <div className="text-xs mt-1">
                        <Badge variant={productCount > 0 ? "default" : "secondary"}>
                          {productCount} produit{productCount > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testFetchProducts(r.id)}
                      disabled={testLoading}
                      className="ml-2"
                    >
                      {testLoading && isTestingThis ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        '🧪 Test'
                      )}
                    </Button>
                  </div>
                  
                  {/* Show test results */}
                  {isTestingThis && testProducts.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-yellow-300 dark:border-yellow-700 space-y-1">
                      <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                        Produits chargés ({testProducts.length}):
                      </div>
                      {testProducts.map((p) => (
                        <div key={p.id} className="text-xs pl-2 border-l border-yellow-300 dark:border-yellow-700">
                          <strong>{p.name}</strong> - {formatCurrency(p.price, 'CDF')}
                          <div className="text-muted-foreground">
                            Cat: {p.category} | ID: {p.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isTestingThis && testProducts.length === 0 && !testLoading && (
                    <div className="mt-2 pt-2 border-t border-yellow-300 dark:border-yellow-700 text-xs text-red-600 dark:text-red-400">
                      ⚠️ Aucun produit chargé !
                    </div>
                  )}
                  
                  {/* Show products from global fetch */}
                  {restaurantProducts.length > 0 && !isTestingThis && (
                    <div className="mt-2 pt-2 border-t border-yellow-300 dark:border-yellow-700 space-y-1">
                      <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                        Produits globaux:
                      </div>
                      {restaurantProducts.slice(0, 3).map((p) => (
                        <div key={p.id} className="text-xs pl-2">
                          {p.name} - {p.price ? formatCurrency(p.price, 'CDF') : 'N/A'}
                        </div>
                      ))}
                      {restaurantProducts.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-2">
                          ... et {restaurantProducts.length - 3} autre(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {debugData && restaurantCount === 0 && (
          <div className="text-center py-4 text-yellow-700 dark:text-yellow-300">
            ⚠️ Aucun restaurant actif trouvé pour {selectedCity}
          </div>
        )}
      </div>
    </Card>
  );
};
