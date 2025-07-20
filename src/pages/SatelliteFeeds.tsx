import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Satellite, 
  Globe, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Download,
  Settings,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function SatelliteFeeds() {
  const { data: satellites, refetch } = useQuery({
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

  const handleRefreshFeed = async (satelliteId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('refresh-satellite-feed', {
        body: { satelliteId }
      });

      if (error) throw error;

      toast({
        title: "Feed Refreshed",
        description: "Satellite feed data has been updated.",
      });

      refetch();
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh satellite feed.",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async (satelliteId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('test-satellite-connection', {
        body: { satelliteId }
      });

      if (error) throw error;

      toast({
        title: "Connection Test",
        description: data.success ? "Connection successful!" : "Connection failed.",
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to test satellite connection.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'active': return 100;
      case 'inactive': return 0;
      default: return 50;
    }
  };

  const satelliteDetails = {
    'sentinel': {
      description: 'European Space Agency\'s Earth observation programme',
      coverage: 'Global',
      resolution: '10-60m',
      revisitTime: '5 days',
      dataTypes: ['Optical', 'Radar']
    },
    'modis': {
      description: 'NASA Terra and Aqua satellites moderate resolution imaging',
      coverage: 'Global',
      resolution: '250m-1km',
      revisitTime: '1-2 days',
      dataTypes: ['Optical', 'Thermal']
    },
    'viirs': {
      description: 'NASA/NOAA Visible Infrared Imaging Radiometer Suite',
      coverage: 'Global',
      resolution: '375m-750m',
      revisitTime: '1 day',
      dataTypes: ['Optical', 'Infrared']
    },
    'planet': {
      description: 'Planet Labs high-resolution satellite constellation',
      coverage: 'Global',
      resolution: '3-5m',
      revisitTime: 'Daily',
      dataTypes: ['Optical']
    },
    'gee': {
      description: 'Google Earth Engine planetary-scale analysis platform',
      coverage: 'Global',
      resolution: 'Variable',
      revisitTime: 'Variable',
      dataTypes: ['Multi-source']
    },
    'maxar': {
      description: 'Maxar/DigitalGlobe high-resolution commercial imagery',
      coverage: 'Global',
      resolution: '30cm-2m',
      revisitTime: '1-3 days',
      dataTypes: ['Optical']
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Satellite Feeds</h1>
          <p className="text-muted-foreground">
            Monitor and manage satellite data sources for intelligence gathering
          </p>
        </div>
        <Button onClick={() => refetch()} className="satellite-glow">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Feed Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Feeds</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {satellites?.filter(s => s.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Operational satellite sources
            </p>
          </CardContent>
        </Card>
        
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Feeds</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {satellites?.filter(s => s.status === 'inactive').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Offline or unavailable sources
            </p>
          </CardContent>
        </Card>
        
        <Card className="satellite-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Global</div>
            <p className="text-xs text-muted-foreground">
              Earth observation capability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Satellite Feed Cards */}
      <div className="grid gap-6">
        {satellites?.map((satellite) => {
          const key = satellite.name.toLowerCase().split(' ')[0].replace('/', '');
          const details = satelliteDetails[key as keyof typeof satelliteDetails] || {
            description: 'Advanced satellite imagery provider',
            coverage: 'Global',
            resolution: 'High',
            revisitTime: 'Variable',
            dataTypes: ['Optical']
          };

          return (
            <Card key={satellite.id} className="satellite-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg satellite-gradient flex items-center justify-center">
                      <Satellite className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{satellite.name}</CardTitle>
                      <CardDescription>{details.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(satellite.status)}
                    <Badge className={satellite.status === 'active' ? 'status-active' : 'status-inactive'}>
                      {satellite.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Technical Specifications */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Technical Specifications</h3>
                    
                    <div className="grid gap-3">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Coverage</span>
                        <Badge variant="outline">{details.coverage}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Resolution</span>
                        <Badge variant="outline">{details.resolution}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Revisit Time</span>
                        <Badge variant="outline">{details.revisitTime}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Data Types</span>
                        <div className="flex gap-1">
                          {details.dataTypes.map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection Status & Controls */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Connection Status</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Connection Quality</span>
                          <span>{getStatusProgress(satellite.status)}%</span>
                        </div>
                        <Progress value={getStatusProgress(satellite.status)} className="h-2" />
                      </div>
                      
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Last Update</span>
                          <span className="text-sm text-muted-foreground">
                            {satellite.last_update ? 
                              new Date(satellite.last_update).toLocaleString() : 
                              'Never'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">API Endpoint</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            Active
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleTestConnection(satellite.id)}
                        >
                          <Wifi className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleRefreshFeed(satellite.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Feed
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Download Data
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Data Timeline */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3">Recent Data Acquisitions</h4>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-muted-foreground">
                          {new Date(Date.now() - (i + 1) * 3600000).toLocaleTimeString()}
                        </span>
                        <span>Data acquisition completed</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {Math.floor(Math.random() * 500) + 100} images
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}