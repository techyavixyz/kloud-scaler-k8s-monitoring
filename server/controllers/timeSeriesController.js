import { Point } from '@influxdata/influxdb-client';
import { writeAPI, queryAPI } from '../config/database.js';

export const writeMetrics = async (namespace, podName, cpu, memory) => {
  try {
    const point = new Point('pod_metrics')
      .tag('namespace', namespace)
      .tag('pod', podName)
      .floatField('cpu', parseFloat(cpu))
      .floatField('memory', parseFloat(memory))
      .timestamp(new Date());

    writeAPI.writePoint(point);
    await writeAPI.flush();
  } catch (error) {
    console.error('Write metrics error:', error);
  }
};

export const getHistoricalMetrics = async (req, res) => {
  try {
    const { namespace, startTime, endTime, aggregation = '5m' } = req.query;

    if (!namespace || !startTime || !endTime) {
      return res.status(400).json({ error: 'Namespace, startTime, and endTime required' });
    }

    const query = `
      from(bucket: "metrics")
        |> range(start: ${startTime}, stop: ${endTime})
        |> filter(fn: (r) => r._measurement == "pod_metrics")
        |> filter(fn: (r) => r.namespace == "${namespace}")
        |> aggregateWindow(every: ${aggregation}, fn: mean, createEmpty: false)
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    const data = [];
    await queryAPI.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        data.push({
          time: o._time,
          namespace: o.namespace,
          pod: o.pod,
          cpu: o.cpu || 0,
          memory: o.memory || 0
        });
      },
      error(error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Failed to query metrics' });
      },
      complete() {
        res.json({ metrics: data });
      }
    });
  } catch (error) {
    console.error('Get historical metrics error:', error);
    res.status(500).json({ error: 'Failed to get historical metrics' });
  }
};

export const deleteOldMetrics = async (req, res) => {
  try {
    const { retentionDays = 30 } = req.body;
    
    const deleteTime = new Date();
    deleteTime.setDate(deleteTime.getDate() - retentionDays);

    const deleteQuery = `
      from(bucket: "metrics")
        |> range(start: 1970-01-01T00:00:00Z, stop: ${deleteTime.toISOString()})
        |> filter(fn: (r) => r._measurement == "pod_metrics")
        |> drop()
    `;

    await queryAPI.queryRows(deleteQuery, {
      next() {},
      error(error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete old metrics' });
      },
      complete() {
        res.json({ message: `Deleted metrics older than ${retentionDays} days` });
      }
    });
  } catch (error) {
    console.error('Delete old metrics error:', error);
    res.status(500).json({ error: 'Failed to delete old metrics' });
  }
};

export const getMetricsSummary = async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    const query = `
      from(bucket: "metrics")
        |> range(start: -${timeRange})
        |> filter(fn: (r) => r._measurement == "pod_metrics")
        |> group(columns: ["namespace"])
        |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    const data = [];
    await queryAPI.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        data.push({
          time: o._time,
          namespace: o.namespace,
          avgCpu: o.cpu || 0,
          avgMemory: o.memory || 0
        });
      },
      error(error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Failed to query metrics summary' });
      },
      complete() {
        res.json({ summary: data });
      }
    });
  } catch (error) {
    console.error('Get metrics summary error:', error);
    res.status(500).json({ error: 'Failed to get metrics summary' });
  }
};