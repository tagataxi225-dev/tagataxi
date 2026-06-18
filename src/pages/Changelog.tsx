import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ChangeItem {
  type: 'feature' | 'fix' | 'performance' | 'security';
  icon: string;
  text: string;
}

interface Version {
  version: string;
  date: string;
  severity: 'info' | 'minor' | 'major' | 'critical';
  changes: ChangeItem[];
}

interface ChangelogData {
  versions: Version[];
}

const severityColors = {
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  minor: 'bg-green-500/10 text-green-500 border-green-500/20',
  major: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20'
};

const typeLabels = {
  feature: 'Nouveauté',
  fix: 'Correction',
  performance: 'Performance',
  security: 'Sécurité'
};

export default function Changelog() {
  const navigate = useNavigate();
  const [changelog, setChangelog] = useState<ChangelogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/CHANGELOG.json')
      .then(res => res.json())
      .then(data => {
        setChangelog(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load changelog:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Historique des versions</h1>
              <p className="text-muted-foreground">
                Toutes les nouveautés et améliorations de TAGA
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6 relative">
          {/* Ligne verticale */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          {changelog?.versions.map((version, index) => (
            <motion.div
              key={version.version}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                {/* Badge de sévérité */}
                <div className="absolute top-4 right-4">
                  <Badge 
                    variant="outline" 
                    className={severityColors[version.severity]}
                  >
                    {version.severity}
                  </Badge>
                </div>

                <CardHeader>
                  <div className="flex items-start gap-4">
                    {/* Point sur la timeline */}
                    <div className="hidden md:block w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex-shrink-0 flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                      v{version.version.split('.')[0]}
                    </div>
                    
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-1">
                        Version {version.version}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(version.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {version.changes.map((change, idx) => (
                      <div key={idx}>
                        {idx > 0 && <Separator className="my-3" />}
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{change.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {typeLabels[change.type]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {change.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>TAGA Taxi • Mobilité africaine</p>
        </div>
      </div>
    </div>
  );
}
