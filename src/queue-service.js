/**
 * queue-service.js — Fila de Automações (in-memory)
 * Gerencia uma fila de automações agendadas para execução sequencial.
 */
const { v4: uuidv4 } = require('uuid');

let _queue = [];
let _running = false;
let _currentJob = null;

/**
 * Add a job to the queue.
 * @param {Object} job - { type: 'citacoes'|'intimacoes'|'arquivados'|'pje', args: Object }
 * @returns {Object} the queued job
 */
function addJob(job) {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
        id,
        type: job.type || 'citacoes',
        args: job.args || {},
        status: 'queued',
        addedAt: new Date().toISOString(),
        startedAt: null,
        finishedAt: null,
        error: null
    };
    _queue.push(entry);
    return entry;
}

/**
 * Remove a job from the queue by ID.
 * Only queued jobs can be removed (not running).
 */
function removeJob(id) {
    const idx = _queue.findIndex(j => j.id === id && j.status === 'queued');
    if (idx === -1) return false;
    _queue.splice(idx, 1);
    return true;
}

/**
 * Get all jobs with optional status filter.
 */
function getJobs(filter = {}) {
    let results = [..._queue];
    if (filter.status) {
        results = results.filter(j => j.status === filter.status);
    }
    return results;
}

/**
 * Get the next queued job and mark it as running.
 * Returns null if no queued jobs.
 */
function getNextJob() {
    const idx = _queue.findIndex(j => j.status === 'queued');
    if (idx === -1) return null;
    _queue[idx].status = 'running';
    _queue[idx].startedAt = new Date().toISOString();
    _currentJob = _queue[idx];
    return _currentJob;
}

/**
 * Mark current job as completed.
 */
function completeJob(id, status = 'completed', error = null) {
    const idx = _queue.findIndex(j => j.id === id);
    if (idx === -1) return false;
    _queue[idx].status = status;
    _queue[idx].finishedAt = new Date().toISOString();
    _queue[idx].error = error;
    if (_currentJob && _currentJob.id === id) {
        _currentJob = null;
    }
    return true;
}

/**
 * Get the currently running job (if any).
 */
function getCurrentJob() {
    return _currentJob;
}

/**
 * Clear completed/errored jobs from queue.
 */
function clearCompleted() {
    _queue = _queue.filter(j => j.status === 'queued' || j.status === 'running');
}

/**
 * Clear entire queue (only queued jobs).
 */
function clearAll() {
    _queue = _queue.filter(j => j.status === 'running');
}

/**
 * Get queue stats.
 */
function getStats() {
    const queued = _queue.filter(j => j.status === 'queued').length;
    const running = _queue.filter(j => j.status === 'running').length;
    const completed = _queue.filter(j => j.status === 'completed').length;
    const errored = _queue.filter(j => j.status === 'errored').length;
    return { queued, running, completed, errored, total: _queue.length };
}

module.exports = {
    addJob,
    removeJob,
    getJobs,
    getNextJob,
    completeJob,
    getCurrentJob,
    clearCompleted,
    clearAll,
    getStats
};
