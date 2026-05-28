import { createClient } from '@/lib/supabase/server'
import UsersClient from './users-client'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase.from('profiles').select('*').order('name')
  return <UsersClient profiles={profiles || []} />
}
