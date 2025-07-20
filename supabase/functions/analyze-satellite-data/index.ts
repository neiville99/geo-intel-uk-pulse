import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { locationId, satelliteSource } = await req.json();

    // Simulate satellite analysis (replace with real API calls)
    const analysisResults = {
      car_count: Math.floor(Math.random() * 100) + 10,
      people_count: Math.floor(Math.random() * 200) + 20,
      average_park_time: Math.random() * 60 + 15,
      traffic_direction: ['north', 'south', 'east', 'west', 'mixed'][Math.floor(Math.random() * 5)],
      confidence_score: Math.random() * 0.4 + 0.6,
    };

    // Insert analysis data
    const { data, error } = await supabase
      .from('analysis_data')
      .insert({
        location_id: locationId,
        satellite_source: satelliteSource || 'sentinel',
        ...analysisResults,
      });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});