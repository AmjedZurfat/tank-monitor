// ===================================================
// server.js — نظام مراقبة خزانات الوقود
// Express + Supabase Backend
// ===================================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Express app ──────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── GET all readings (optionally filtered) ───────────────────────────────────
// Query params: station_key, tank_id, from_date, to_date
app.get('/api/readings', async (req, res) => {
  try {
    const { station_key, tank_id, from_date, to_date } = req.query;

    let query = supabase
      .from('readings')
      .select('*')
      .order('reading_date', { ascending: true });

    if (station_key) query = query.eq('station_key', station_key);
    if (tank_id)     query = query.eq('tank_id', tank_id);
    if (from_date)   query = query.gte('reading_date', from_date);
    if (to_date)     query = query.lte('reading_date', to_date);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('GET /api/readings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST add or update a reading ─────────────────────────────────────────────
// Body: { tank_id, station_key, reading_date, manual_val, elec_val }
app.post('/api/readings', async (req, res) => {
  try {
    const { tank_id, station_key, reading_date, manual_val, elec_val } = req.body;

    if (!tank_id || !station_key || !reading_date || manual_val == null || elec_val == null) {
      return res.status(400).json({ success: false, error: 'جميع الحقول مطلوبة' });
    }

    // Upsert — insert or update if same tank+date exists
    const { data, error } = await supabase
      .from('readings')
      .upsert(
        { tank_id, station_key, reading_date, manual_val, elec_val },
        { onConflict: 'tank_id,reading_date' }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('POST /api/readings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE a reading ─────────────────────────────────────────────────────────
app.delete('/api/readings/:tank_id/:reading_date', async (req, res) => {
  try {
    const { tank_id, reading_date } = req.params;

    const { error } = await supabase
      .from('readings')
      .delete()
      .eq('tank_id', tank_id)
      .eq('reading_date', reading_date);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/readings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET summary stats per station/tank ───────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const { station_key, from_date, to_date } = req.query;

    let query = supabase
      .from('readings')
      .select('station_key, tank_id, manual_val, elec_val, reading_date');

    if (station_key) query = query.eq('station_key', station_key);
    if (from_date)   query = query.gte('reading_date', from_date);
    if (to_date)     query = query.lte('reading_date', to_date);

    const { data, error } = await query;
    if (error) throw error;

    // Compute stats per tank
    const stats = {};
    data.forEach(r => {
      const key = r.tank_id;
      if (!stats[key]) stats[key] = { count: 0, manual_sum: 0, elec_sum: 0, station_key: r.station_key };
      stats[key].count++;
      stats[key].manual_sum += parseFloat(r.manual_val);
      stats[key].elec_sum   += parseFloat(r.elec_val);
    });

    Object.keys(stats).forEach(k => {
      stats[k].manual_avg = (stats[k].manual_sum / stats[k].count).toFixed(2);
      stats[k].elec_avg   = (stats[k].elec_sum   / stats[k].count).toFixed(2);
      stats[k].diff_avg   = ((stats[k].elec_sum - stats[k].manual_sum) / stats[k].count).toFixed(2);
    });

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Fallback → serve index.html ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Tank Monitor running on http://localhost:${PORT}`);
  console.log(`📡 Supabase: ${process.env.SUPABASE_URL}`);
});
