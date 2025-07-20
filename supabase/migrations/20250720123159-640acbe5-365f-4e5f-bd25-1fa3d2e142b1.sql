-- Create locations table for monitoring sites
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_type TEXT NOT NULL, -- 'airport', 'government', 'transport', 'port'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis_data table for storing satellite analysis results
CREATE TABLE public.analysis_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  satellite_source TEXT NOT NULL, -- 'sentinel', 'modis', 'planet', 'gee', 'maxar'
  car_count INTEGER DEFAULT 0,
  people_count INTEGER DEFAULT 0,
  average_park_time DECIMAL(10, 2) DEFAULT 0, -- in minutes
  traffic_direction TEXT, -- 'north', 'south', 'east', 'west', 'mixed'
  image_url TEXT,
  confidence_score DECIMAL(3, 2) DEFAULT 0.5, -- 0.0 to 1.0
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create satellites table for tracking API sources
CREATE TABLE public.satellites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  api_endpoint TEXT,
  status TEXT DEFAULT 'active',
  last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satellites ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Public can view locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Public can view analysis data" ON public.analysis_data FOR SELECT USING (true);
CREATE POLICY "Public can view satellites" ON public.satellites FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_analysis_data_location_id ON public.analysis_data(location_id);
CREATE INDEX idx_analysis_data_date ON public.analysis_data(analysis_date);
CREATE INDEX idx_locations_type ON public.locations(location_type);

-- Insert UK monitoring locations
INSERT INTO public.locations (name, description, latitude, longitude, location_type) VALUES
('Buckingham Palace', 'Official residence of the British monarch', 51.501364, -0.141890, 'government'),
('MI5 Headquarters', 'Security Service headquarters at Thames House', 51.490280, -0.124630, 'government'),
('MI6 Headquarters', 'Secret Intelligence Service at Vauxhall Cross', 51.487800, -0.124580, 'government'),
('Heathrow Airport', 'Busiest airport in the UK', 51.469603, -0.461940, 'airport'),
('Gatwick Airport', 'Second busiest airport in the UK', 51.148056, -0.190278, 'airport'),
('London Bridge Station', 'Major railway terminus in central London', 51.505100, -0.086700, 'transport'),
('King''s Cross Station', 'Major railway terminus in London', 51.530400, -0.123100, 'transport'),
('Port of London', 'Major port on the River Thames', 51.449167, 0.705000, 'port'),
('Port of Dover', 'Major ferry port', 51.129000, 1.310400, 'port'),
('Manchester Airport', 'Major international airport', 53.365000, -2.273000, 'airport');

-- Insert satellite sources
INSERT INTO public.satellites (name, api_endpoint, status) VALUES
('Sentinel (ESA)', 'https://scihub.copernicus.eu/dhus/', 'active'),
('NASA MODIS', 'https://modis.gsfc.nasa.gov/data/', 'active'),
('NASA VIIRS', 'https://ladsweb.modaps.eosdis.nasa.gov/', 'active'),
('Planet Labs', 'https://api.planet.com/', 'active'),
('Google Earth Engine', 'https://earthengine.googleapis.com/', 'active'),
('Maxar/DigitalGlobe', 'https://api.maxar.com/', 'active');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_data_updated_at
  BEFORE UPDATE ON public.analysis_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();