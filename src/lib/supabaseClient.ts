import { createClient } from "@supabase/supabase-js";

// Supabase 프로젝트의 Settings > API에서 URL과 Anon Key를 확인하세요.
const supabaseUrl = "https://ptgwlohbpzqrlczsbuek.supabase.co";
const supabaseKey = "sb_publishable_p0knjWt1gsdDXLm6ZaBV5w_QECMu764";

export const supabase = createClient(supabaseUrl, supabaseKey);
