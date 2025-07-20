import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Car, 
  Users, 
  Clock, 
  Navigation,
  RefreshCw,
  Filter,
  Download,
  Eye
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Analysis() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedSatellite, setSelectedSatellite] = useState<string>('all');

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: satellites } = useQuery({
    queryKey: ['satellites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('satellites')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: analysisData, refetch } = useQuery({
    queryKey: ['analysis-data', selectedLocation, selectedSatellite],
    queryFn: async () => {
      let query = supabase
        .from('analysis_data')
        .select(`
          *,
          locations(name, location_type, description)
        `)
        .order('analysis_date', { ascending: false });

      if (selectedLocation !== 'all') {
        query = query.eq('location_id', selectedLocation);
      }
      if (selectedSatellite !== 'all') {
        query = query.eq('satellite_source', selectedSatellite);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const handleRunAnalysis = async () => {
    try {
      // Trigger satellite analysis via edge function
      const { data, error } = await supabase.functions.invoke('analyze-satellite-data', {
        body: { 
          locationId: selectedLocation === 'all' ? null : selectedLocation,
          satelliteSource: selectedSatellite === 'all' ? null : selectedSatellite
        }
      });

      if (error) throw error;

      toast({
        title: "Analysis Started",
        description: "Satellite analysis is running. Results will appear shortly.",
      });

      // Refresh the data
      refetch();
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to start satellite analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction?.toLowerCase()) {
      case 'north': return '↑';
      case 'south': return '↓';
      case 'east': return '→';
      case 'west': return '←';
      default: return '⚬';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Analysis</h1>
          <p className="text-muted-foreground">
            Detailed satellite imagery analysis for strategic UK locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleRunAnalysis} className="satellite-glow">
            <Eye className="h-4 w-4 mr-2" />
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="satellite-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analysis Filters
          </CardTitle>
          <CardDescription>Filter analysis data by location and satellite source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Satellite Source</label>
              <Select value={selectedSatellite} onValueChange={setSelectedSatellite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select satellite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="sentinel">Sentinel (ESA)</SelectItem>
                  <SelectItem value="modis">NASA MODIS</SelectItem>
                  <SelectItem value="viirs">NASA VIIRS</SelectItem>
                  <SelectItem value="planet">Planet Labs</SelectItem>
                  <SelectItem value="gee">Google Earth Engine</SelectItem>
                  <SelectItem value="maxar">Maxar/DigitalGlobe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Input type="date" className="bg-background" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <div className="grid gap-6">
        {analysisData?.map((analysis) => (
          <Card key={analysis.id} className="satellite-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {analysis.locations?.name}
                  </CardTitle>
                  <CardDescription>{analysis.locations?.description}</CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    {analysis.satellite_source?.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {new Date(analysis.analysis_date).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Analysis Metrics</h3>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Vehicle Count</span>
                      </div>
                      <span className="text-lg font-bold text-primary">{analysis.car_count}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">People Count</span>
                      </div>
                      <span className="text-lg font-bold text-primary">{analysis.people_count}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Avg Park Time</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {analysis.average_park_time?.toFixed(1)}m
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Traffic Direction</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {getDirectionIcon(analysis.traffic_direction || 'mixed')} {analysis.traffic_direction || 'Mixed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Confidence Score</span>
                      <span className={`text-sm font-bold ${getConfidenceColor(analysis.confidence_score || 0)}`}>
                        {((analysis.confidence_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(analysis.confidence_score || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Satellite Imagery</h3>
                  <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                    {analysis.image_url ? (
                      <img 
                        src={analysis.image_url} 
                        alt="Satellite imagery"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Satellite image processing...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View Full
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!analysisData?.length && (
          <Card className="satellite-card">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Analysis Data</h3>
                <p className="text-sm mb-4">
                  No satellite analysis data found for the selected filters.
                </p>
                <Button onClick={handleRunAnalysis} className="satellite-glow">
                  <Eye className="h-4 w-4 mr-2" />
                  Start Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}