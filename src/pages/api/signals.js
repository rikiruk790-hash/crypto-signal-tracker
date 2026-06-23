import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const { status = 'all', limit = 50 } = req.query

  let query = supabase
    .from('signals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(parseInt(limit))

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ signals: data || [] })
}
