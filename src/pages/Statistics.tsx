import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Car, 
  Users, 
  Clock, 
  MapPin,
  Calendar,
  Target
} from "lucide-react";
import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Statistics() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

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

  const { data: statisticsData } = useQuery({
    queryKey: ['statistics', selectedLocation, timeRange],
    queryFn: async () => {
      let query = supabase
        .from('analysis_data')
        .select(`
          *,
          locations(name, location_type)
        `);

      if (selectedLocation !== 'all') {
        query = query.eq('location_id', selectedLocation);
      }

      // Add time range filter
      const now = new Date();
      let timeFilter = new Date();
      switch (timeRange) {
        case '1h':
          timeFilter.setHours(now.getHours() - 1);
          break;
        case '24h':
          timeFilter.setDate(now.getDate() - 1);
          break;
        case '7d':
          timeFilter.setDate(now.getDate() - 7);
          break;
        case '30d':
          timeFilter.setDate(now.getDate() - 30);
          break;
      }

      query = query.gte('analysis_date', timeFilter.toISOString());

      const { data, error } = await query.order('analysis_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Calculate statistics
  const stats = statisticsData ? {
    totalAnalyses: statisticsData.length,
    carCounts: statisticsData.map(d => d.car_count || 0),
    peopleCounts: statisticsData.map(d => d.people_count || 0),
    parkTimes: statisticsData.map(d => d.average_park_time || 0),
    confidenceScores: statisticsData.map(d => d.confidence_score || 0),
  } : {
    totalAnalyses: 0,
    carCounts: [],
    peopleCounts: [],
    parkTimes: [],
    confidenceScores: [],
  };

  const calculateStats = (values: number[]) => {
    if (values.length === 0) return { total: 0, average: 0, min: 0, max: 0 };
    
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { total, average, min, max };
  };

  const carStats = calculateStats(stats.carCounts);
  const peopleStats = calculateStats(stats.peopleCounts);
  const parkTimeStats = calculateStats(stats.parkTimes);
  const confidenceStats = calculateStats(stats.confidenceScores);

  // Location breakdown
  const locationBreakdown = locations?.map(location => {
    const locationData = statisticsData?.filter(d => d.location_id === location.id) || [];
    const locationCarStats = calculateStats(locationData.map(d => d.car_count || 0));
    const locationPeopleStats = calculateStats(locationData.map(d => d.people_count || 0));
    
    return {
      ...location,
      analysisCount: locationData.length,
      carStats: locationCarStats,
      peopleStats: locationPeopleStats,
    };
  }) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights from satellite analysis data
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="satellite-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistics Filters
          </CardTitle>
          <CardDescription>Customize your analytics view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
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
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Data points collected
            </p>
          </CardContent>
        </Card>
        
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {(confidenceStats.average * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Analysis accuracy score
            </p>
          </CardContent>
        </Card>
        
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.max(carStats.max, peopleStats.max)}
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum detected count
            </p>
          </CardContent>
        </Card>
        
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Park Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {parkTimeStats.average.toFixed(1)}m
            </div>
            <p className="text-xs text-muted-foreground">
              Average duration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vehicle Statistics */}
        <Card className="satellite-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicle Statistics
            </CardTitle>
            <CardDescription>Car count analysis across monitored locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-primary">{carStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-primary">{carStats.average.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Average</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-primary">{carStats.max}</div>
                  <div className="text-xs text-muted-foreground">Peak</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Minimum Count:</span>
                  <span className="font-medium">{carStats.min}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maximum Count:</span>
                  <span className="font-medium">{carStats.max}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Data Points:</span>
                  <span className="font-medium">{stats.carCounts.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* People Statistics */}
        <Card className="satellite-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              People Statistics
            </CardTitle>
            <CardDescription>Person count analysis across monitored locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-primary">{peopleStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-primary">{peopleStats.average.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Average</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-primary">{peopleStats.max}</div>
                  <div className="text-xs text-muted-foreground">Peak</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Minimum Count:</span>
                  <span className="font-medium">{peopleStats.min}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maximum Count:</span>
                  <span className="font-medium">{peopleStats.max}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Data Points:</span>
                  <span className="font-medium">{stats.peopleCounts.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Breakdown */}
      <Card className="satellite-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location Breakdown
          </CardTitle>
          <CardDescription>Statistics broken down by individual locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locationBreakdown.map((location) => (
              <div key={location.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{location.name}</h3>
                    <p className="text-sm text-muted-foreground">{location.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {location.location_type}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {location.analysisCount} analyses
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      Vehicle Stats
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-bold">{location.carStats.total}</div>
                        <div className="text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-bold">{location.carStats.average.toFixed(1)}</div>
                        <div className="text-muted-foreground">Avg</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-bold">{location.carStats.max}</div>
                        <div className="text-muted-foreground">Max</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      People Stats
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-bold">{location.peopleStats.total}</div>
                        <div className="text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-bold">{location.peopleStats.average.toFixed(1)}</div>
                        <div className="text-muted-foreground">Avg</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded">
                        <div className="font-bold">{location.peopleStats.max}</div>
                        <div className="text-muted-foreground">Max</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}