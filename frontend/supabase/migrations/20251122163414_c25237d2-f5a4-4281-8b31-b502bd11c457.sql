-- Create enum for app roles (admin, policy_analyst, user)
CREATE TYPE public.app_role AS ENUM ('admin', 'policy_analyst', 'user');

-- Create enum for policy criterion severity
CREATE TYPE public.criterion_severity AS ENUM ('critical', 'major', 'minor');

-- Create enum for comparison operators
CREATE TYPE public.comparison_operator AS ENUM ('GTE', 'LTE', 'EQ');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create user_policies table to store custom policy requirements
CREATE TABLE public.user_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  policy_name TEXT NOT NULL,
  creation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  original_source_snippet TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  criteria JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_policies
ALTER TABLE public.user_policies ENABLE ROW LEVEL SECURITY;

-- Policies for user_policies
CREATE POLICY "Users can view their own policies"
  ON public.user_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own policies"
  ON public.user_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policies"
  ON public.user_policies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own policies"
  ON public.user_policies FOR DELETE
  USING (auth.uid() = user_id);

-- Create policy_evaluation_cache table for storing grounded compliance results
CREATE TABLE public.policy_evaluation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.user_policies(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  overall_status TEXT NOT NULL,
  evaluation_details JSONB NOT NULL DEFAULT '{}'::JSONB,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (policy_id, model_id)
);

-- Enable RLS on policy_evaluation_cache
ALTER TABLE public.policy_evaluation_cache ENABLE ROW LEVEL SECURITY;

-- Policies for policy_evaluation_cache
CREATE POLICY "Users can view evaluations for their policies"
  ON public.policy_evaluation_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_policies
      WHERE user_policies.id = policy_evaluation_cache.policy_id
      AND user_policies.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for user_policies
CREATE TRIGGER update_user_policies_updated_at
  BEFORE UPDATE ON public.user_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for user_roles (users can view their own roles, admins can manage all)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster policy lookups
CREATE INDEX idx_user_policies_user_id ON public.user_policies(user_id);
CREATE INDEX idx_user_policies_is_active ON public.user_policies(user_id, is_active);
CREATE INDEX idx_policy_evaluation_cache_policy_id ON public.policy_evaluation_cache(policy_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);