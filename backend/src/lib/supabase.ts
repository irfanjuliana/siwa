import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dhxdgpvkimsuoislowti.supabase.co';
export const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);
