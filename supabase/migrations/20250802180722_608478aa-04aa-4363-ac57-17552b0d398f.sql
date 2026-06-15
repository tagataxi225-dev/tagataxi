-- Create user_places table for storing recent and favorite places
CREATE TABLE public.user_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  coordinates JSONB,
  place_type TEXT NOT NULL DEFAULT 'recent',
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_places ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own places" 
ON public.user_places 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own places" 
ON public.user_places 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own places" 
ON public.user_places 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own places" 
ON public.user_places 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_places_updated_at
BEFORE UPDATE ON public.user_places
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_user_places_user_id ON public.user_places(user_id);
CREATE INDEX idx_user_places_last_used ON public.user_places(last_used DESC);
CREATE INDEX idx_user_places_type ON public.user_places(place_type);