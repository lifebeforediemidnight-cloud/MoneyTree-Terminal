/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, PluggableAdapter, VenueName } from '../types';
import { Plus, Trash2, Power, Eye, EyeOff, ShieldAlert, CheckCircle, Database, Award, Code, HelpCircle } from 'lucide-react';

interface AccountManagerProps {
  accounts: Account[];
  adapters: PluggableAdapter[];
  onAddAccount: (data: { name: string; venue: string; type: 'equity' | 'crypto'; isPaper: boolean; credentials: Record<string, string> }) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onConnectAccount: (id: string) => Promise<void>;
  onDisconnectAccount: (id: string) => Promise<void>;
  onRegisterAdapter: (data: { name: string; type: 'equity' | 'crypto'; fields: Array<{ key: string; label: string; type: 'text' | 'password' }> }) => Promise<void>;
}

export default function AccountManager({
  accounts,
  adapters,
  onAddAccount,
  onDeleteAccount,
  onConnectAccount,
  onDisconnectAccount,
  onRegisterAdapter
}: AccountManagerProps) {
  // Account Form states
  const [name, setName] = useState('');
  const [selectedAdapterId, setSelectedAdapterId] = useState(adapters[0]?.id || 'dhan');
  const [isPaper, setIsPaper] = useState(true);
  const [formCredentials, setFormCredentials] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // New Adapter Form states
  const [showAdapterCreator, setShowAdapterCreator] = useState(false);
  const [newAdapterName, setNewAdapterName] = useState('');
  const [newAdapterType, setNewAdapterType] = useState<'equity' | 'crypto'>('equity');
  const [newFields, setNewFields] = useState<Array<{ key: string; label: string; type: 'text' | 'password' }>>([
    { key: 'apiKey', label: 'API Key', type: 'text' },
    { key: 'apiSecret', label: 'API Secret', type: 'password' }
  ]);

  // Selected Adapter configuration Details
  const activeAdapter = adapters.find(a => a.id === selectedAdapterId) || adapters[0];

  const handleAdapterChange = (adapterId: string) => {
    setSelectedAdapterId(adapterId);
    setFormCredentials({});
    setSubmissionError(null);
  };

  const handleCredentialChange = (fieldKey: string, value: string) => {
    setFormCredentials(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmissionError('Account name is required.');
      return;
    }

    // Validate we filled in all adapter credentials
    if (!activeAdapter) return;
    const missingFields = activeAdapter.fields.filter(f => !formCredentials[f.key]?.trim());
    if (missingFields.length > 0) {
      setSubmissionError(`Missing credentials: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      await onAddAccount({
        name: name.trim(),
        venue: activeAdapter.id,
        type: activeAdapter.type,
        isPaper,
        credentials: formCredentials
      });
      // Clear
      setName('');
      setFormCredentials({});
      setIsPaper(true);
    } catch (err: any) {
      setSubmissionError(err.message || 'Failed to register account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAdapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdapterName.trim()) return;
    
    try {
      await onRegisterAdapter({
        name: newAdapterName,
        type: newAdapterType,
        fields: newFields
      });
      setNewAdapterName('');
      setShowAdapterCreator(false);
    } catch (err: any) {
      alert(err.message || 'Failed to register adapter');
    }
  };

  const addCustomFieldInput = () => {
    setNewFields(prev => [...prev, { key: `custom_${Date.now()}`, label: 'Custom Parameter', type: 'text' }]);
  };

  const handleFieldChange = (index: number, key: 'label' | 'type', value: string) => {
    setNewFields(prev => {
      const copy = [...prev];
      if (key === 'label') {
        const generatedKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
        copy[index] = { ...copy[index], label: value, key: generatedKey };
      } else {
        copy[index] = { ...copy[index], type: value as 'text' | 'password' };
      }
      return copy;
    });
  };

  const removeCustomFieldInput = (index: number) => {
    setNewFields(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* LEFT COLUMN: Form and Pluggable adapter setup */}
      <div className="lg:col-span-5 space-y-4">
        {/* Link Account form */}
        <div className="bg-[#111214] border border-[#2D2F31] rounded-lg p-4">
          <h2 className="text-xs font-bold tracking-wider text-white uppercase mb-3 flex items-center gap-1.5 font-mono">
            <Plus className="w-4 h-4 text-blue-500" />
            Connect Broker Venue / API Credentials
          </h2>

          <form onSubmit={handleAddAccountSubmit} className="space-y-4 text-xs text-[#D1D1D1]">
            {/* Display Name */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8E9299] mb-1 tracking-wider" htmlFor="acc_name_input">Account Nickname</label>
              <input
                id="acc_name_input"
                type="text"
                placeholder="e.g. My Primary Dhan Account"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#1A1C1E] border border-[#2D2F31] rounded px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Venue Selector */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8E9299] mb-1 tracking-wider" htmlFor="acc_adapter_select">Trading Adapter</label>
              <div className="flex gap-2">
                <select
                  id="acc_adapter_select"
                  value={selectedAdapterId}
                  onChange={e => handleAdapterChange(e.target.value)}
                  className="flex-1 bg-[#1A1C1E] border border-[#2D2F31] rounded px-2.5 py-1.5 text-white outline-none focus:border-blue-500 font-mono text-[11px]"
                >
                  {adapters.map(ad => (
                    <option key={ad.id} value={ad.id}>
                      {ad.name} ({ad.type})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAdapterCreator(!showAdapterCreator)}
                  className="px-2.5 bg-[#1A1C1E] border border-[#2D2F31] rounded hover:bg-[#2D2F31] text-[10px] text-blue-500 hover:text-white flex items-center gap-1 transition-colors"
                  id="btn_toggle_custom_adapter"
                  title="Register new custom pluggable adapter"
                >
                  <Code className="w-3 h-3" />
                  <span>Pluggable +</span>
                </button>
              </div>
            </div>

            {/* Simulated Credentials Fields determined by target adapter model */}
            {activeAdapter && (
              <div className="p-3 bg-[#1A1C1E]/50 rounded border border-[#2D2F31] space-y-3">
                <div className="text-[10px] font-mono text-[#8E9299] flex items-center justify-between pb-1.5 border-b border-[#2D2F31]">
                  <span>VAULT PARAMS SCOPE:</span>
                  <span className="text-blue-500 font-semibold uppercase">
                    {activeAdapter.type === 'equity' 
                      ? `account.<id>.${activeAdapter.fields[0]?.key || 'key'}`
                      : `crypto:${activeAdapter.id}:*`}
                  </span>
                </div>

                {activeAdapter.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-[9px] uppercase font-bold text-[#8E9299] mb-1 tracking-wider" htmlFor={`input_cred_${field.key}`}>
                      {field.label} {field.key === 'accessToken' && <span className="text-[9px] text-amber-500 normal-case">(Write "FAIL" to simulate credential errors)</span>}
                    </label>
                    <input
                      id={`input_cred_${field.key}`}
                      type={field.type}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      value={formCredentials[field.key] || ''}
                      onChange={e => handleCredentialChange(field.key, e.target.value)}
                      className="w-full bg-[#1A1C1E] border border-[#2D2F31] rounded px-3 py-1.5 font-mono text-[11px] text-white outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Paper trading toggler matching sleek toggle design */}
            <div className="flex items-center justify-between bg-[#1A1C1E] p-3 rounded border border-[#2D2F31]">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">PAPER TRADING MODE</span>
                <span className="text-[9px] text-[#8E9299]">Risk-free execution sandbox environment</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaper(!isPaper)}
                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${isPaper ? 'bg-blue-600' : 'bg-[#2D2F31]'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isPaper ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Error notifications */}
            {submissionError && (
              <div className="p-2.5 rounded bg-rose-950/20 border border-rose-900/50 text-[11px] text-rose-400 flex items-start gap-1.5 font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-[#1A1C1E] text-white text-[11px] font-bold py-2.5 rounded cursor-pointer transition-all shadow-lg shadow-blue-900/20"
              id="btn_add_account_submit"
            >
              {isSubmitting ? 'Securing Credentials...' : 'SAVE & ENCRYPT VALUE'}
            </button>
          </form>
        </div>

        {/* Dynamic Pluggable Adapter Creator Popup Card */}
        {showAdapterCreator && (
          <div className="bg-[#111214] border border-blue-900/50 rounded-lg p-4 shadow-xl">
            <h3 className="text-xs font-bold tracking-wider text-blue-500 uppercase mb-3 flex items-center gap-1 font-mono">
              <Code className="w-4 h-4" />
              Register Pluggable Broker Adapter (Qt SDK Concept)
            </h3>

            <form onSubmit={handleRegisterAdapterSubmit} className="space-y-3.5 text-xs text-[#D1D1D1]">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#8E9299] mb-1" htmlFor="new_adapter_name">Adapter Venue Name</label>
                <input
                  id="new_adapter_name"
                  type="text"
                  placeholder="e.g. Zerodha Pro, OKX Prime"
                  value={newAdapterName}
                  onChange={e => setNewAdapterName(e.target.value)}
                  className="w-full bg-[#1A1C1E] border border-[#2D2F31] rounded px-3 py-1.5 text-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#8E9299] mb-1">Venue Market Class</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAdapterType('equity')}
                    className={`py-1.5 rounded font-mono text-[10px] text-center border cursor-pointer ${newAdapterType === 'equity' ? 'bg-blue-950/40 border-blue-500 text-slate-200' : 'bg-[#1A1C1E] border-[#2D2F31]'}`}
                    id="btn_adapter_class_equity"
                  >
                    EQUITY BROKER (REST/WS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAdapterType('crypto')}
                    className={`py-1.5 rounded font-mono text-[10px] text-center border cursor-pointer ${newAdapterType === 'crypto' ? 'bg-blue-950/40 border-blue-500 text-white' : 'bg-[#1A1C1E] border-[#2D2F31]'}`}
                    id="btn_adapter_class_crypto"
                  >
                    CRYPTO EXCHANGE (CCXT)
                  </button>
                </div>
              </div>

              {/* Fields custom config */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-[#8E9299]">Required Config Inputs</span>
                  <button
                    type="button"
                    onClick={addCustomFieldInput}
                    className="text-[10px] text-blue-500 hover:text-white"
                  >
                    + Add Parameter input
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {newFields.map((field, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-black/40 p-2 rounded border border-[#2D2F31]">
                      <input
                        type="text"
                        placeholder="Parameter Name"
                        value={field.label}
                        onChange={e => handleFieldChange(idx, 'label', e.target.value)}
                        className="flex-1 bg-[#1A1C1E] border border-[#2D2F31] rounded px-2 py-1 select-all font-mono text-[10px] outline-none"
                      />
                      <select
                        value={field.type}
                        onChange={e => handleFieldChange(idx, 'type', e.target.value)}
                        className="bg-[#1A1C1E] border border-[#2D2F31] text-[10px] font-mono rounded px-1 py-1 outline-none"
                      >
                        <option value="text">Text (Public)</option>
                        <option value="password">Password (Encrypted GCM)</option>
                      </select>
                      {newFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCustomFieldInput(idx)}
                          className="text-rose-400 hover:text-rose-300 p-0.5"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdapterCreator(false)}
                  className="px-3 py-1.5 border border-[#2D2F31] hover:bg-[#1A1C1E] rounded text-[#8E9299]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 font-bold hover:bg-blue-500 text-white rounded cursor-pointer shadow-lg shadow-blue-900/20"
                >
                  Deploy Adapter Module
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Active list card */}
      <div className="lg:col-span-7 flex flex-col space-y-3">
        <div className="bg-[#111214] border border-[#2D2F31] rounded-lg p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-wider text-white uppercase font-mono flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-500" />
              Configured Venues Account Stack
            </h2>
            <span className="text-[10px] py-0.5 px-2 bg-[#1A1C1E] border border-[#2D2F31] text-[#8E9299] font-mono rounded-full">
              Accounts: {accounts.length}
            </span>
          </div>

          {accounts.length === 0 ? (
            <div className="flex-1 border border-dashed border-[#2D2F31] rounded-lg flex flex-col items-center justify-center p-8 text-center text-[#5C5F63]">
              <div className="p-3 bg-black/20 rounded-full mb-3 border border-[#2D2F31]">
                <HelpCircle className="w-6 h-6 text-[#8E9299]" />
              </div>
              <h3 className="text-xs font-semibold text-slate-300">No trading venues linked yet</h3>
              <p className="text-[11px] text-[#8E9299] mt-1 max-w-sm">
                Add an equity broker (like Dhan API) or a crypto exchange, choose either Live routing or Paper sandbox mode, and lock your keys in the secure local vault.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">
              {accounts.map(acc => {
                const isConnected = acc.status === 'connected';
                return (
                  <div
                    key={acc.id}
                    className={`bg-[#151619]/50 border rounded-lg p-3.5 flex flex-col transition-all justify-between leading-snug hover:bg-[#1A1C1E] ${isConnected ? 'border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.04)] ring-1 ring-emerald-500/10' : 'border-[#2D2F31]'}`}
                  >
                    <div>
                      {/* Name & Type */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white text-xs tracking-tight truncate max-w-[150px]" title={acc.name}>
                            {acc.name}
                          </h3>
                          <span className="text-[10px] font-mono text-blue-500 uppercase tracking-wider block">
                            {acc.venue} ({acc.type})
                          </span>
                        </div>
                        {/* Status Badges */}
                        <div className="flex flex-col items-end gap-1.5">
                          {isConnected ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              LIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#2D2F31] text-[#8E9299] border border-[#3D4043] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5C5F63]" />
                              OFF
                            </span>
                          )}

                          {acc.isPaper ? (
                            <span className="inline-flex font-mono text-[9px] px-1.5 py-0.1 bg-blue-950/50 text-blue-300 border border-blue-900/40 rounded">
                              PAPER PROTOCOL
                            </span>
                          ) : (
                            <span className="inline-flex font-mono text-[9px] px-1.5 py-0.1 bg-amber-950/50 text-amber-400 border border-amber-900/40 rounded">
                              REAL TRADING
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Portfolio balance or stats */}
                      <div className="mt-3 py-1.5 px-2 bg-[#1A1C1E] rounded border border-[#2D2F31] flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#8E9299]">Portfolio Cash:</span>
                        <span className="text-emerald-500 font-bold">
                          {acc.isPaper ? `₹${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Link complete (Live)'}
                        </span>
                      </div>

                      {/* Display scoped keys */}
                      <div className="mt-2 text-[10px] font-mono bg-black/30 p-1 px-2 rounded text-[#5C5F63] space-y-1">
                        {Object.keys(acc.credentials).map(credK => (
                          <div key={credK} className="flex justify-between">
                            <span>{credK}:</span>
                            <span className="text-white/60 truncate max-w-[130px]">{acc.credentials[credK]}</span>
                          </div>
                        ))}
                      </div>

                      {/* Show connection error if exists */}
                      {acc.error && (
                        <div className="mt-2.5 p-2 bg-red-950/20 border border-red-900/45 text-[10px] text-red-400 font-mono rounded">
                          <strong>Connection Blocked:</strong> {acc.error}
                        </div>
                      )}
                    </div>

                    {/* Action controllers */}
                    <div className="mt-4 pt-3.5 border-t border-[#2D2F31] flex items-center justify-between gap-2 text-xs">
                      {isConnected ? (
                        <button
                          onClick={() => onDisconnectAccount(acc.id)}
                          className="flex-1 cursor-pointer bg-red-900/30 text-red-400 border border-red-900/50 text-[10px] font-bold py-1 px-2 rounded hover:bg-red-900/40 flex items-center justify-center gap-1 transition-colors font-mono"
                        >
                          <Power className="w-3 h-3 text-red-400" />
                          DISCONNECT
                        </button>
                      ) : (
                        <button
                          onClick={() => onConnectAccount(acc.id)}
                          className="flex-1 cursor-pointer bg-emerald-600 text-white text-[10px] font-bold py-1 px-2 rounded hover:bg-emerald-500 flex items-center justify-center gap-1 transition-colors font-mono"
                        >
                          <Power className="w-3 h-3 text-white animate-pulse" />
                          CONNECT
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteAccount(acc.id)}
                        className="p-1 cursor-pointer text-[#8E9299] hover:text-red-400 hover:bg-red-900/20 border border-[#2D2F31] rounded transition-colors"
                        title="Delete account database & purge encryption vault keys"
                        id={`btn_delete_acc_${acc.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
