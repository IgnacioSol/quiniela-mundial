import { createClient } from '@/lib/supabase/server'
import PaymentsClient from './payments-client'

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase.from('profiles').select('*').order('name')
  return <PaymentsClient profiles={profiles || []} />
}
