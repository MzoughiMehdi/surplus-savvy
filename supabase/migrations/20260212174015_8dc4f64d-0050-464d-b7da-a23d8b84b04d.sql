
-- Create support_replies table
CREATE TABLE public.support_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'merchant')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;

-- Admins can view all replies
CREATE POLICY "Admins can view all replies"
ON public.support_replies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert replies
CREATE POLICY "Admins can insert replies"
ON public.support_replies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND sender_id = auth.uid());

-- Owners can view replies on their messages
CREATE POLICY "Owners can view replies on own messages"
ON public.support_replies
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM support_messages sm
  JOIN restaurants r ON r.id = sm.restaurant_id
  WHERE sm.id = support_replies.message_id
  AND r.owner_id = auth.uid()
));

-- Owners can insert replies on their messages
CREATE POLICY "Owners can insert replies on own messages"
ON public.support_replies
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM support_messages sm
    JOIN restaurants r ON r.id = sm.restaurant_id
    WHERE sm.id = support_replies.message_id
    AND r.owner_id = auth.uid()
  )
);
