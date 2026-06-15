-- Create push notification system tables

-- Table for storing user push tokens
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  device_name TEXT,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, token, platform)
);

-- Table for notification queue with retry mechanism
CREATE TABLE IF NOT EXISTS public.push_notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  recipients TEXT[] NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'retry', 'scheduled')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for notification analytics
CREATE TABLE IF NOT EXISTS public.push_notification_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'received', 'opened', 'action')),
  notification_id UUID,
  notification_data JSONB DEFAULT '{}',
  device_info JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for push_notification_tokens
CREATE POLICY "Users can view their own push tokens" 
ON public.push_notification_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens" 
ON public.push_notification_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens" 
ON public.push_notification_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all push tokens" 
ON public.push_notification_tokens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create RLS policies for push_notification_queue
CREATE POLICY "Admins can manage notification queue" 
ON public.push_notification_queue 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create RLS policies for push_notification_analytics
CREATE POLICY "Users can view their own notification analytics" 
ON public.push_notification_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification analytics" 
ON public.push_notification_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification analytics" 
ON public.push_notification_analytics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_active ON public.push_notification_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON public.push_notification_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_push_queue_status ON public.push_notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_push_queue_scheduled ON public.push_notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_push_queue_priority ON public.push_notification_queue(priority);
CREATE INDEX IF NOT EXISTS idx_push_analytics_user ON public.push_notification_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_push_analytics_event ON public.push_notification_analytics(event_type);

-- Create updated_at trigger functions
CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_push_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_notification_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_push_tokens_updated_at();

CREATE TRIGGER update_push_queue_updated_at
BEFORE UPDATE ON public.push_notification_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_push_queue_updated_at();