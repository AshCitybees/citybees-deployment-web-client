import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';

// ── SectionCard ───────────────────────────────────────────────────────────────
export const SectionCard = ({ children, style }) => (
  <div style={{
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px',
    width: '100%',
    transition: 'border-color 0.2s',
    ...style,
  }}>
    {children}
  </div>
);

// ── SectionHeader ─────────────────────────────────────────────────────────────
export const SectionHeader = ({ label, icon: Icon, trailing }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    {Icon && <Icon size={14} color="var(--accent)" strokeWidth={2} />}
    <span style={{
      fontSize: 11, fontWeight: 700, color: 'var(--accent)',
      letterSpacing: '1.8px', textTransform: 'uppercase',
    }}>{label}</span>
    {trailing && <div style={{ marginLeft: 'auto' }}>{trailing}</div>}
  </div>
);

// ── ToggleRow ─────────────────────────────────────────────────────────────────
export const ToggleRow = ({ label, subtitle, value, onChange, icon: Icon }) => (
  <div
    onClick={() => onChange(!value)}
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.05)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
      background: value ? 'var(--accent-dim)' : 'var(--surface)',
      border: `1px solid ${value ? 'var(--border-accent)' : 'var(--border)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s',
    }}>
      {Icon && <Icon size={18} color={value ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth={1.8} />}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
    </div>
    <Toggle value={value} onChange={onChange} />
  </div>
);

// ── Toggle Switch ─────────────────────────────────────────────────────────────
export const Toggle = ({ value, onChange }) => (
  <div
    onClick={e => { e.stopPropagation(); onChange(!value); }}
    style={{
      width: 46, height: 26, borderRadius: 13, cursor: 'pointer',
      background: value
        ? 'linear-gradient(135deg, var(--accent), #D4780A)'
        : 'var(--surface)',
      border: `1.5px solid ${value ? 'transparent' : 'var(--border)'}`,
      position: 'relative', transition: 'all 0.22s', flexShrink: 0,
      boxShadow: value ? '0 2px 8px rgba(245,166,35,0.3)' : 'none',
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      background: value ? '#0A0B0E' : 'var(--text-muted)',
      position: 'absolute', top: 3,
      left: value ? 23 : 3,
      transition: 'all 0.22s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }} />
  </div>
);

// ── PillTag ───────────────────────────────────────────────────────────────────
export const PillTag = ({ label, onRemove, color = 'var(--accent)' }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 20,
    background: `${color}15`, border: `1px solid ${color}40`,
    fontSize: 11, fontWeight: 500, color,
  }}>
    {label}
    {onRemove && (
      <X size={12} color={color} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={onRemove} />
    )}
  </div>
);

// ── ActionButton ──────────────────────────────────────────────────────────────
export const ActionButton = ({ label, onClick, isLoading, icon: Icon, color = 'var(--accent)' }) => {
  const isAccent = color === 'var(--accent)';
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        width: '100%', height: 56, borderRadius: 14,
        background: isLoading
          ? `${color}55`
          : isAccent
            ? 'linear-gradient(135deg, var(--accent) 0%, #D4780A 100%)'
            : color,
        color: isAccent ? '#0A0B0E' : 'var(--text-primary)',
        fontSize: 14, fontWeight: 700, letterSpacing: '0.5px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: isLoading ? 'none' : isAccent ? '0 4px 20px rgba(245,166,35,0.25)' : 'none',
        border: isAccent ? 'none' : `1px solid var(--border)`,
      }}
      onMouseEnter={e => {
        if (!isLoading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = isAccent
            ? '0 8px 30px rgba(245,166,35,0.35)'
            : '0 4px 12px rgba(0,0,0,0.3)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isAccent ? '0 4px 20px rgba(245,166,35,0.25)' : 'none';
      }}
    >
      {isLoading
        ? <Spinner size={22} color={isAccent ? '#0A0B0E' : 'var(--text-primary)'} />
        : <>{Icon && <Icon size={18} strokeWidth={2} />}{label}</>
      }
    </button>
  );
};

// ── ResultBanner ──────────────────────────────────────────────────────────────
export const ResultBanner = ({ isSuccess, message }) => {
  const color = isSuccess ? 'var(--success)' : 'var(--error)';
  const dim = isSuccess ? 'var(--success-dim)' : 'var(--error-dim)';
  return (
    <div style={{
      padding: '16px 20px', borderRadius: 14,
      border: `1px solid ${color}40`,
      borderLeft: `3px solid ${color}`,
      background: dim,
      display: 'flex', alignItems: 'flex-start', gap: 12,
      animation: 'fadeInUp 0.3s ease',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isSuccess
          ? <Check size={16} color={color} strokeWidth={2.5} />
          : <span style={{ fontSize: 16, lineHeight: 1, color }}>⚠</span>
        }
      </div>
      <span style={{ fontSize: 13, color, lineHeight: 1.5, paddingTop: 4 }}>{message}</span>
    </div>
  );
};

// ── StyledInput ───────────────────────────────────────────────────────────────
export const StyledInput = ({ value, onChange, placeholder, onKeyDown, type = 'text', style }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    style={{
      width: '100%', height: 46, borderRadius: 12,
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      color: 'var(--text-primary)', fontSize: 13, padding: '0 14px',
      outline: 'none', transition: 'all 0.15s',
      ...style,
    }}
    onFocus={e => {
      e.target.style.borderColor = 'var(--accent)';
      e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)';
    }}
    onBlur={e => {
      e.target.style.borderColor = 'var(--border)';
      e.target.style.boxShadow = 'none';
    }}
  />
);

// ── StyledTextarea ────────────────────────────────────────────────────────────
export const StyledTextarea = ({ value, onChange, placeholder, rows = 2 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      width: '100%', borderRadius: 12, resize: 'vertical',
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      color: 'var(--text-primary)', fontSize: 13, padding: '12px 14px',
      outline: 'none', transition: 'all 0.15s', lineHeight: 1.6,
    }}
    onFocus={e => {
      e.target.style.borderColor = 'var(--accent)';
      e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)';
    }}
    onBlur={e => {
      e.target.style.borderColor = 'var(--border)';
      e.target.style.boxShadow = 'none';
    }}
  />
);

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 16, color = 'var(--accent)' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `2px solid ${color}30`,
    borderTopColor: color,
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  }} />
);

// ── ModuleCard ────────────────────────────────────────────────────────────────
export const ModuleCard = ({ module, selected, onToggle, accentColor, extraInfo }) => (
  <div
    onClick={onToggle}
    style={{
      padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
      background: selected ? `${accentColor}0E` : 'var(--surface)',
      border: `${selected ? 1.5 : 1}px solid ${selected ? `${accentColor}55` : 'var(--border)'}`,
      transition: 'all 0.18s ease',
      boxShadow: selected ? `0 0 16px ${accentColor}10` : 'none',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Checkbox */}
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        background: selected
          ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
          : 'transparent',
        border: `1.5px solid ${selected ? 'transparent' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        boxShadow: selected ? `0 2px 6px ${accentColor}30` : 'none',
      }}>
        {selected && <Check size={12} color="#0A0B0E" strokeWidth={3} />}
      </div>
      {/* Status dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: selected ? accentColor : 'var(--text-muted)',
        boxShadow: selected ? `0 0 6px ${accentColor}` : 'none',
        transition: 'all 0.15s',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: selected ? 600 : 400,
          color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {module.appName}
        </div>
        {extraInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
            {extraInfo}
          </div>
        )}
      </div>
      {/* BE/FE badge */}
      <div style={{
        padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700,
        letterSpacing: '0.5px',
        background: `${accentColor}${selected ? '22' : '0C'}`,
        color: selected ? accentColor : 'var(--text-muted)',
        flexShrink: 0, transition: 'all 0.15s',
      }}>
        {module.isBackend ? 'BE' : 'FE'}
      </div>
    </div>
  </div>
);

// ── TinyBadge ─────────────────────────────────────────────────────────────────
export const TinyBadge = ({ label, color }) => (
  <span style={{
    padding: '2px 7px', borderRadius: 5,
    background: `${color}18`, color,
    fontSize: 9, fontWeight: 600, letterSpacing: '0.3px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: 140, display: 'inline-block',
    border: `1px solid ${color}25`,
  }}>
    {label}
  </span>
);

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, title, message, onConfirm, confirmLabel = 'Confirm', confirmColor = 'var(--error)', icon }) => {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      style={{ position: 'fixed', inset: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ padding: 28, maxWidth: 420, width: '100%' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {icon && (
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${confirmColor}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {icon}
            </div>
          )}
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px', borderRadius: 10, background: 'transparent',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: '1px solid var(--border)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            style={{
              padding: '10px 20px', borderRadius: 10,
              background: confirmColor === 'var(--error)'
                ? 'linear-gradient(135deg, var(--error), #cc3a50)'
                : confirmColor === 'var(--accent)'
                  ? 'linear-gradient(135deg, var(--accent), #D4780A)'
                  : confirmColor,
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 4px 12px ${confirmColor}30`,
            }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};
