-- Add deployed_at column to track when funnel was deployed
ALTER TABLE public.user_funnels
ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient deployed status queries
CREATE INDEX IF NOT EXISTS idx_user_funnels_deployed_at
ON public.user_funnels(deployed_at)
WHERE deployed_at IS NOT NULL;

COMMENT ON COLUMN public.user_funnels.deployed_at IS 'Timestamp when funnel was successfully deployed to GHL. NULL means not yet deployed.';
