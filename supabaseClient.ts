
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com as chaves da sua conta
const supabaseUrl = 'https://kinflfbkajhthfpfkkfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbmZsZmJrYWpodGhmcGZra2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTc0OTQsImV4cCI6MjA3OTA5MzQ5NH0.CnFOQ-ChbgFsDi4wDjptika-DRoTTNcVRtlFGcNP8zM';

export const supabase = createClient(supabaseUrl, supabaseKey);
