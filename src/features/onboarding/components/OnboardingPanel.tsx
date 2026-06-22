import { Link } from 'react-router-dom'
import {
  getOnboardingSteps,
  isMainOnboardingComplete,
  type OnboardingSnapshot,
  type OnboardingStepStatus,
} from '../onboardingSelectors'

interface OnboardingPanelProps {
  snapshot: OnboardingSnapshot
  dismissed: boolean
  onDismiss: () => void
  onRestore: () => void
}

const statusLabels: Record<OnboardingStepStatus, string> = {
  done: '已完成',
  next: '下一步',
  optional: '選用',
  locked: '尚未解鎖',
}

const actionLabels: Record<Exclude<OnboardingStepStatus, 'locked'>, string> = {
  done: '查看',
  next: '開始這一步',
  optional: '前往設定',
}

export function OnboardingPanel({
  snapshot,
  dismissed,
  onDismiss,
  onRestore,
}: OnboardingPanelProps) {
  const steps = getOnboardingSteps(snapshot)
  const mainFlowComplete = isMainOnboardingComplete(steps)
  const forceExpanded = snapshot.taskCount === 0

  if (dismissed && !forceExpanded) {
    return (
      <section className="onboarding-collapsed" aria-label="開始使用指引">
        <div>
          <strong>使用指引已收合</strong>
          <p>需要時可重新查看 Tomato Planner 的基本流程。</p>
        </div>
        <button type="button" className="secondary" onClick={onRestore}>
          重新顯示
        </button>
      </section>
    )
  }

  const visibleSteps = mainFlowComplete ? steps.slice(3) : steps

  return (
    <section className="onboarding-panel" aria-labelledby="onboarding-title">
      <div className="onboarding-header">
        <div>
          <h2 id="onboarding-title">開始使用 Tomato Planner</h2>
          <p>先建立任務，再安排到時間格線，最後用番茄鐘專注執行。</p>
        </div>
        {!forceExpanded && (
          <button type="button" className="secondary" onClick={onDismiss}>
            收合指引
          </button>
        )}
      </div>

      {mainFlowComplete && (
        <p className="onboarding-complete-message">
          你已完成基本流程。以下整合可依需要選用。
        </p>
      )}

      <ol className={`onboarding-steps${mainFlowComplete ? ' is-compact' : ''}`}>
        {visibleSteps.map((step) => (
          <li className={`onboarding-step status-${step.status}`} key={step.id}>
            <div className="onboarding-step-content">
              <span className={`onboarding-badge status-${step.status}`}>
                {statusLabels[step.status]}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
            {step.status === 'locked' || !step.href ? (
              <span className="onboarding-locked-action">請先完成前一步</span>
            ) : (
              <Link className="onboarding-action" to={step.href}>
                {actionLabels[step.status]}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
