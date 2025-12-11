-- Create saved_sessions table
CREATE TABLE IF NOT EXISTS saved_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  results_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_sessions_user_id ON saved_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_created_at ON saved_sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own sessions
CREATE POLICY "Users can view their own sessions"
  ON saved_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own sessions
CREATE POLICY "Users can create their own sessions"
  ON saved_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON saved_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own sessions
CREATE POLICY "Users can delete their own sessions"
  ON saved_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
