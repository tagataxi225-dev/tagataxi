import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Download, Upload, FileText, Map, Code2 } from 'lucide-react'

interface ZoneImportExportProps {
  zones: any[]
  onImport: (data: any[]) => void
  onExport: (format: string) => void
}

export const ZoneImportExport: React.FC<ZoneImportExportProps> = ({
  zones,
  onImport,
  onExport
}) => {
  const [importFormat, setImportFormat] = useState<string>('json')
  const [importData, setImportData] = useState<string>('')
  const [exportFormat, setExportFormat] = useState<string>('json')
  const { toast } = useToast()

  const handleImport = () => {
    try {
      let parsedData: any[]

      switch (importFormat) {
        case 'json':
          parsedData = JSON.parse(importData)
          break
        case 'csv':
          parsedData = parseCSV(importData)
          break
        case 'geojson':
          parsedData = parseGeoJSON(importData)
          break
        default:
          throw new Error('Format non supporté')
      }

      // Validation des données
      if (!Array.isArray(parsedData)) {
        throw new Error('Les données doivent être un tableau')
      }

      // Validation basique de la structure
      const validatedData = parsedData.map((zone, index) => {
        if (!zone.name || !zone.coordinates) {
          throw new Error(`Zone ${index + 1}: nom et coordonnées requis`)
        }
        return {
          name: zone.name,
          zone_type: zone.zone_type || 'commercial',
          city: zone.city || 'Kinshasa',
          coordinates: zone.coordinates,
          description: zone.description || '',
          base_price_multiplier: zone.base_price_multiplier || 1.0,
          status: zone.status || 'active'
        }
      })

      onImport(validatedData)
      setImportData('')
      toast({
        title: "Import réussi",
        description: `${validatedData.length} zone(s) importée(s)`,
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleExport = () => {
    try {
      let exportData: string
      let filename: string
      let mimeType: string

      switch (exportFormat) {
        case 'json':
          exportData = JSON.stringify(zones, null, 2)
          filename = 'zones.json'
          mimeType = 'application/json'
          break
        case 'csv':
          exportData = generateCSV(zones)
          filename = 'zones.csv'
          mimeType = 'text/csv'
          break
        case 'geojson':
          exportData = generateGeoJSON(zones)
          filename = 'zones.geojson'
          mimeType = 'application/geo+json'
          break
        case 'kml':
          exportData = generateKML(zones)
          filename = 'zones.kml'
          mimeType = 'application/vnd.google-earth.kml+xml'
          break
        default:
          throw new Error('Format non supporté')
      }

      // Télécharger le fichier
      const blob = new Blob([exportData], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export réussi",
        description: `Zones exportées en ${exportFormat.toUpperCase()}`,
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const parseCSV = (csvData: string): any[] => {
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const zone: any = {}
      
      headers.forEach((header, index) => {
        if (header === 'coordinates') {
          try {
            zone[header] = JSON.parse(values[index])
          } catch {
            zone[header] = []
          }
        } else if (header === 'base_price_multiplier') {
          zone[header] = parseFloat(values[index]) || 1.0
        } else {
          zone[header] = values[index]
        }
      })
      
      return zone
    })
  }

  const parseGeoJSON = (geoJsonData: string): any[] => {
    const geojson = JSON.parse(geoJsonData)
    
    if (geojson.type !== 'FeatureCollection') {
      throw new Error('GeoJSON doit être une FeatureCollection')
    }
    
    return geojson.features.map((feature: any) => {
      const coordinates = feature.geometry.coordinates[0] // Premier anneau du polygone
      
      return {
        name: feature.properties.name || 'Zone sans nom',
        zone_type: feature.properties.zone_type || 'commercial',
        city: feature.properties.city || 'Kinshasa',
        coordinates: coordinates,
        description: feature.properties.description || '',
        base_price_multiplier: feature.properties.base_price_multiplier || 1.0,
        status: feature.properties.status || 'active'
      }
    })
  }

  const generateCSV = (zones: any[]): string => {
    const headers = ['name', 'zone_type', 'city', 'coordinates', 'description', 'base_price_multiplier', 'status']
    const csvRows = [headers.join(',')]
    
    zones.forEach(zone => {
      const row = headers.map(header => {
        const value = zone[header]
        if (header === 'coordinates') {
          return `"${JSON.stringify(value)}"`
        }
        return `"${value || ''}"`
      })
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }

  const generateGeoJSON = (zones: any[]): string => {
    const features = zones.map(zone => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [zone.coordinates]
      },
      properties: {
        name: zone.name,
        zone_type: zone.zone_type,
        city: zone.city,
        description: zone.description,
        base_price_multiplier: zone.base_price_multiplier,
        status: zone.status
      }
    }))

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2)
  }

  const generateKML = (zones: any[]): string => {
    const placemarks = zones.map(zone => {
      const coordinates = zone.coordinates.map((coord: number[]) => 
        `${coord[1]},${coord[0]},0`
      ).join(' ')

      return `
    <Placemark>
      <name>${zone.name}</name>
      <description>${zone.description}</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordinates}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`
    }).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Zones TAGA</name>
    <description>Zones de service TAGA</description>${placemarks}
  </Document>
</kml>`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer des Zones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="import-format">Format d'import</Label>
            <Select value={importFormat} onValueChange={setImportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="geojson">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    GeoJSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="import-data">Données à importer</Label>
            <Textarea
              id="import-data"
              placeholder="Collez vos données ici..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={8}
            />
          </div>

          <Button 
            onClick={handleImport} 
            className="w-full"
            disabled={!importData.trim()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter des Zones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="export-format">Format d'export</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="geojson">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    GeoJSON
                  </div>
                </SelectItem>
                <SelectItem value="kml">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    KML
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Zones disponibles: {zones.length}</p>
            <p>Formats supportés:</p>
            <ul className="list-disc list-inside ml-2">
              <li>JSON - Format natif</li>
              <li>CSV - Tableur</li>
              <li>GeoJSON - Standard géographique</li>
              <li>KML - Google Earth</li>
            </ul>
          </div>

          <Button 
            onClick={handleExport} 
            className="w-full"
            disabled={zones.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter ({zones.length} zones)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default ZoneImportExport