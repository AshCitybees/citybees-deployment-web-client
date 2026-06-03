import React from 'react';
import {
  CheckCircle, RefreshCw, ArrowRight, Code, Server,
  GitMerge, Rocket, Database, Zap, Activity, GitBranch,
  Clock, Shield, ChevronRight,
} from 'lucide-react';
import { SettingsService } from '../services/settingsService.js';

/* ── tiny helpers ── */
const Spacer = ({ h }) => <div style={{ height: h }} />;

/* ── Stat Card ── */
const StatCard = ({ value, label, color, icon: Icon, glow }) => (
  <div style={{
    flex: 1, minWidth: 0,
    background: 'var(--surface-elevated)',
    border: `1px solid ${glow ? color + '40' : 'var(--border)'}`,
    borderRadius: 16,
    padding: '20px 22px',
    display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: glow ? `0 0 24px ${color}20` : 'none',
    transition: 'all 0.2s',
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: `${color}18`,
      border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={20} color={color} strokeWidth={2} />
    </div>
    <div>
      <div style={{
        fontSize: 28, fontWeight: 800, color,
        fontFamily: 'var(--font-mono)', letterSpacing: '-1px', lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontSize: 11, color: 'var(--text-muted)', marginTop: 4,
        letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 600,
      }}>{label}</div>
    </div>
  </div>
);

/* ── Tag pill ── */
const Tag = ({ label, color }) => (
  <span style={{
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: `${color}15`, border: `1px solid ${color}35`, color,
  }}>{label}</span>
);

/* ── Branch flow ── */
const BranchFlow = ({ branches }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
    {branches.map((b, i) => (
      <React.Fragment key={i}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 8,
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <b.icon size={11} color="var(--text-muted)" />
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}>{b.platform}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{b.branch}</div>
          </div>
        </div>
        {i < branches.length - 1 && (
          <ArrowRight size={13} color="var(--text-muted)" />
        )}
      </React.Fragment>
    ))}
  </div>
);

/* ── Function Card ── */
const FunctionCard = ({ title, subtitle, icon: Icon, iconColor, tags, tagColor, branches, onClick, delayMs, badge }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--surface-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: '28px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      animation: `fadeInUp 0.4s cubic-bezier(0.22,0.61,0.36,1) ${delayMs}ms both`,
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = tagColor + '55';
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.3), 0 0 30px ${tagColor}15`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {/* Subtle top gradient */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 1,
      background: `linear-gradient(90deg, transparent, ${tagColor}60, transparent)`,
    }} />

    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: `${iconColor}18`, border: `1px solid ${iconColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${iconColor}20`,
      }}>
        <Icon size={24} color={iconColor} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          {badge && (
            <span style={{
              padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: tagColor + '20', color: tagColor, letterSpacing: '0.5px',
            }}>{badge}</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{subtitle}</div>
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${tagColor}12`, border: `1px solid ${tagColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ChevronRight size={16} color={tagColor} />
      </div>
    </div>

    {/* Tags */}
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
      {tags.map(t => <Tag key={t} label={t} color={tagColor} />)}
    </div>

    {/* Divider */}
    <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

    {/* Branch flow */}
    <BranchFlow branches={branches} />
  </div>
);

/* ── Pipeline Step ── */
const PipelineStep = ({ platform, branch, color, isLast }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{
      width: '100%', padding: '14px 18px', borderRadius: 12,
      background: `${color}0F`, border: `1px solid ${color}35`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Database size={15} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{platform}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{branch}</div>
      </div>
    </div>
    {!isLast && (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0' }}>
        <div style={{ width: 1, height: 8, background: 'var(--border)' }} />
        <div style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1 }}>↓</div>
        <div style={{ width: 1, height: 8, background: 'var(--border)' }} />
      </div>
    )}
  </div>
);

/* ══════════════════════════════════════════════════
   HOME SCREEN
══════════════════════════════════════════════════ */
export default function HomeScreen({ onNavigate }) {
  const hasUrl = SettingsService.baseUrl.length > 0;

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={18} color="var(--accent)" />
          <span style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '2px',
          }}>DASHBOARD</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: 'var(--success-dim)', border: '1px solid rgba(34,211,122,0.2)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 6px var(--success)',
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>
              All Systems Operational
            </span>
          </div>
        </div>
      </div>

      <div className="page-wrapper">

        {/* ── URL Warning Banner ── */}
        {!hasUrl && (
          <div style={{
            padding: '14px 20px', borderRadius: 14, marginBottom: 32,
            background: 'rgba(255,92,114,0.08)',
            border: '1px solid rgba(255,92,114,0.25)',
            borderLeft: '3px solid var(--error)',
            display: 'flex', alignItems: 'center', gap: 14,
            animation: 'fadeInUp 0.3s ease',
          }}>
            <Shield size={18} color="var(--error)" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: 'var(--error)' }}>
              Azure Function URL not configured — deployment functions are disabled.
            </span>
            <button
              onClick={() => onNavigate('settings')}
              style={{
                padding: '7px 16px', borderRadius: 8,
                background: 'rgba(255,92,114,0.15)',
                border: '1px solid rgba(255,92,114,0.3)',
                color: 'var(--error)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Configure →
            </button>
          </div>
        )}

        {/* ── Hero ── */}
        <div style={{
          padding: '40px 44px',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInUp 0.4s cubic-bezier(0.22,0.61,0.36,1) 60ms both',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #F5A623 0%, #D4780A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(245,166,35,0.35)',
            }}>
              <Zap size={24} color="#0A0B0E" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{
                fontSize: 26, fontWeight: 800, color: 'var(--text-primary)',
                letterSpacing: '-0.5px', lineHeight: 1.2,
              }}>
                Citybees Deploy
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Automated CI/CD pipeline control centre
              </div>
            </div>
          </div>

          <div style={{
            fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7,
            maxWidth: 580,
          }}>
            Orchestrate deployments across GitHub and GitLab — trigger UAT approvals,
            sync production branches, manage modules, and track every run — all from one place.
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              onClick={() => onNavigate('uat')}
              style={{
                padding: '10px 22px', borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent), #D4780A)',
                color: '#0A0B0E', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: '0 4px 16px rgba(245,166,35,0.25)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <CheckCircle size={15} /> UAT Approval
            </button>
            <button
              onClick={() => onNavigate('wac')}
              style={{
                padding: '10px 22px', borderRadius: 10,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 7,
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface-hover)';
                e.currentTarget.style.borderColor = 'var(--text-muted)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <RefreshCw size={15} /> WAC Prod Sync
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div style={{
          display: 'flex', gap: 16, marginBottom: 32,
          animation: 'fadeInUp 0.4s cubic-bezier(0.22,0.61,0.36,1) 120ms both',
        }}>
          <StatCard value="4" label="Apps" color="var(--accent)" icon={Database} glow />
          <StatCard value="8" label="Branches" color="var(--success)" icon={GitBranch} glow />
          <StatCard value="2" label="Functions" color="var(--info)" icon={Zap} />
          <StatCard value="24/7" label="Uptime" color="var(--text-secondary)" icon={Clock} />
        </div>

        {/* ── Section Label ── */}
        <SectionLabel label="Deployment Functions" delay={160} />
        <Spacer h={16} />

        {/* ── Function Cards (2 col) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
          <FunctionCard
            title="UAT Approval"
            subtitle="GitHub → GitLab sync with PR creation and mail notification"
            icon={CheckCircle}
            iconColor="var(--accent)"
            tags={['HTTP Trigger', 'Test + Prod', 'Mail', 'PRs']}
            tagColor="var(--accent)"
            badge="MANUAL"
            branches={[
              { platform: 'GitHub', branch: 'staging-test', icon: Code },
              { platform: 'GitLab', branch: 'uat-test/*', icon: GitMerge },
              { platform: 'GitLab', branch: 'release/*', icon: Rocket },
            ]}
            onClick={() => onNavigate('uat')}
            delayMs={180}
          />
          <FunctionCard
            title="WAC Prod Sync"
            subtitle="GitLab → GitHub release sync — runs daily at 07:00 & 20:00 UTC"
            icon={RefreshCw}
            iconColor="var(--success)"
            tags={['Timer Trigger', 'Daily', 'Mail', 'PRs']}
            tagColor="var(--success)"
            badge="SCHEDULED"
            branches={[
              { platform: 'GitLab', branch: 'release/*', icon: Server },
              { platform: 'GitHub', branch: 'WAC-prod-branch', icon: GitMerge },
              { platform: 'GitHub', branch: 'master', icon: Rocket },
            ]}
            onClick={() => onNavigate('wac')}
            delayMs={220}
          />
        </div>

        {/* ── Pipeline + Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Pipeline */}
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.22,0.61,0.36,1) 260ms both' }}>
            <SectionLabel label="Pipeline Overview" />
            <Spacer h={16} />
            <div style={{
              background: 'var(--surface-elevated)', border: '1px solid var(--border)',
              borderRadius: 20, padding: 24,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '2px',
                color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16,
              }}>
                PIPELINE FLOW
              </div>
              <PipelineStep platform="GitHub" branch="staging-test" color="var(--accent)" />
              <PipelineStep platform="GitLab" branch="uat-test/* + release/*" color="var(--warning)" />
              <PipelineStep platform="GitHub" branch="WAC-prod → master" color="var(--success)" isLast />
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.22,0.61,0.36,1) 300ms both' }}>
            <SectionLabel label="Quick Actions" />
            <Spacer h={16} />
            <div style={{
              background: 'var(--surface-elevated)', border: '1px solid var(--border)',
              borderRadius: 20, padding: 24,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <QuickAction
                label="Trigger UAT Approval"
                desc="Sync staging → GitLab, send mail"
                color="var(--accent)"
                icon={CheckCircle}
                onClick={() => onNavigate('uat')}
              />
              <div style={{ height: 1, background: 'var(--border)' }} />
              <QuickAction
                label="Trigger WAC Prod Sync"
                desc="Sync GitLab release → GitHub master"
                color="var(--success)"
                icon={RefreshCw}
                onClick={() => onNavigate('wac')}
              />
              <div style={{ height: 1, background: 'var(--border)' }} />
              <QuickAction
                label="View Run History"
                desc="See all past deployment logs"
                color="var(--info)"
                icon={Activity}
                onClick={() => onNavigate('history')}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Section Label ── */
const SectionLabel = ({ label, delay = 0 }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    animation: delay ? `fadeInUp 0.3s ease ${delay}ms both` : undefined,
  }}>
    <div style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--accent)' }} />
    <span style={{
      fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
      letterSpacing: '2px', textTransform: 'uppercase',
    }}>{label}</span>
  </div>
);

/* ── Quick Action Row ── */
const QuickAction = ({ label, desc, color, icon: Icon, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      cursor: 'pointer', padding: '4px 0',
      transition: 'opacity 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
  >
    <div style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: `${color}15`, border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={18} color={color} strokeWidth={1.8} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
    </div>
    <ChevronRight size={16} color="var(--text-muted)" />
  </div>
);
