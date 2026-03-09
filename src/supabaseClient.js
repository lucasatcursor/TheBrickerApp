import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipsrzjpgwyjcbnkotmdn.supabase.co';
const supabaseKey = 'sb_publishable_E2pQJA2SPsJRGdE46uSZtA_RxkJjiDx';

export const supabase = createClient(supabaseUrl, supabaseKey);