import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Car, 
  Users, 
  Clock, 
  Navigation, 
  Satellite,
  TrendingUp,
  AlertTriangle,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
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

  const { data: recentAnalysis } = useQuery({
    queryKey: ['recent-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_data')
        .select(`
          *,
          locations(name, location_type)
        `)
        .order('analysis_date', { ascending: false })
        .limit(10);
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

  const totalCars = recentAnalysis?.reduce((sum, item) => sum + (item.car_count || 0), 0) || 0;
  const totalPeople = recentAnalysis?.reduce((sum, item) => sum + (item.people_count || 0), 0) || 0;
  const avgParkTime = recentAnalysis?.length ? 
    recentAnalysis.reduce((sum, item) => sum + (item.average_park_time || 0), 0) / recentAnalysis.length : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time satellite intelligence across UK strategic locations
          </p>
        </div>
        <Button className="satellite-glow">
          <Activity className="h-4 w-4 mr-2" />
          Live Analysis
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCars}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last hour
            </p>
          </CardContent>
        </Card>
        
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">People Count</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalPeople}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% from last hour
            </p>
          </CardContent>
        </Card>
        
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Park Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{avgParkTime.toFixed(1)}m</div>
            <p className="text-xs text-muted-foreground">
              <Navigation className="h-3 w-3 inline mr-1" />
              Across all locations
            </p>
          </CardContent>
        </Card>
        
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Satellites</CardTitle>
            <Satellite className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {satellites?.filter(s => s.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {satellites?.length || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Analysis */}
        <Card className="satellite-card">
          <CardHeader>
            <CardTitle>Recent Analysis</CardTitle>
            <CardDescription>Latest satellite data analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnalysis?.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium">{analysis.locations?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(analysis.analysis_date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Car className="h-3 w-3 mr-1" />
                        {analysis.car_count}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {analysis.people_count}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analysis.confidence_score && `${(analysis.confidence_score * 100).toFixed(0)}% confidence`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Satellite Status */}
        <Card className="satellite-card">
          <CardHeader>
            <CardTitle>Satellite Network</CardTitle>
            <CardDescription>Current status of satellite data sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {satellites?.map((satellite) => (
                <div key={satellite.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Satellite className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{satellite.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last update: {satellite.last_update ? 
                          new Date(satellite.last_update).toLocaleTimeString() : 
                          'Never'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={satellite.status === 'active' ? 'status-active' : 'status-inactive'}
                  >
                    {satellite.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Grid */}
      <Card className="satellite-card">
        <CardHeader>
          <CardTitle>Monitored Locations</CardTitle>
          <CardDescription>Strategic UK locations under satellite surveillance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations?.map((location) => (
              <div key={location.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{location.name}</h3>
                  <Badge variant="outline" className="text-xs capitalize">
                    {location.location_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{location.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{location.latitude.toFixed(4)}°N</span>
                  <span>{location.longitude.toFixed(4)}°W</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Analysis Progress</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="satellite-card border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Active Alerts
          </CardTitle>
          <CardDescription>Recent anomalies and alerts requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Unusual traffic pattern detected</p>
                <p className="text-xs text-muted-foreground">
                  Heathrow Airport - 15:30 GMT
                </p>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                Medium
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Satellite feed interruption</p>
                <p className="text-xs text-muted-foreground">
                  Planet Labs - Connection lost
                </p>
              </div>
              <Badge variant="outline" className="text-red-600 border-red-500/30">
                High
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}