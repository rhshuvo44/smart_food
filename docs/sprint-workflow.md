# Sprint Workflow

## Sprint Cadence

| Duration | 2 weeks (10 working days) |
|----------|--------------------------|
| Planning | Day 1, 2 hours |
| Execution | Days 2–9 |
| Review & Retro | Day 10, 2.5 hours |

## Sprint Planning (Day 1)

### Pre-Planning (Before Meeting)

- Product manager grooms backlog (top 2 sprints' worth)
- Stories have acceptance criteria and story points
- Dependencies identified and flagged
- Historical velocity calculated

### Planning Meeting (09:00–11:00)

1. **Sprint Goal Definition** (15 min)
   - Product manager presents sprint objective
   - Business priority alignment

2. **Capacity Planning** (30 min)
   - Calculate team capacity: (available days × hours/day × focus factor)
   - Account for: PTO, ceremonies, support rotation
   - Focus factor: 0.6–0.7 (includes meetings, reviews, overhead)

3. **Story Assignment** (45 min)
   - Pull stories from prioritized backlog into sprint
   - Assign story points based on Fibonacci scale (1, 2, 3, 5, 8, 13)
   - Each developer picks tickets within their capacity

4. **Risk Assessment** (30 min)
   - Identify dependencies between tickets
   - Flag potential blockers
   - Document assumptions

### Output
- Sprint backlog with assigned tickets
- Sprint goal documented
- Risks and dependencies documented

## Sprint Execution (Days 2–9)

### Daily Standup (Async, 09:00)

Each team member answers:
- What did I work on yesterday?
- What am I working on today?
- Any blockers?

### Mid-Sprint Check-In (Day 5, 30 min)

- Review progress against sprint goal
- Identify at-risk tickets
- Adjust scope if needed (add/remove with product manager approval)
- Unblock any blocked developers

### WIP Limits

| State | Max Items |
|-------|-----------|
| In Progress (per developer) | 2 |
| In Review | 3 per team |
| Blocked | Escalate within 4 hours |

## Sprint Review (Day 10, 09:00–10:00)

1. Demo completed work (15 min per major feature)
2. Review sprint goal achievement
3. Stakeholder feedback
4. Update backlog based on feedback

## Sprint Retrospective (Day 10, 10:00–11:00)

### Structure

1. **Gather Data** (15 min)
   - What went well?
   - What could be improved?
   - What was confusing?

2. **Generate Insights** (15 min)
   - Identify root causes of problems
   - Group related themes
   - Prioritize top 3 improvements

3. **Decide Actions** (15 min)
   - Create SMART action items
   - Assign owners and deadlines
   - Track to completion

4. **Close** (15 min)
   - Review previous retrospective actions
   - Celebrate wins
   - Next sprint preview

### Metrics Tracked

| Metric | Target |
|--------|--------|
| Velocity | Tracked per sprint |
| Completion rate | >= 85% of committed points |
| Bug rate | < 5 bugs per sprint |
| Review turnaround | < 24 hours to first review |
| Test coverage | >= 85% (no regression) |

## Story Point Reference

| Points | Complexity | Effort | Examples |
|--------|-----------|--------|----------|
| 1 | Trivial | < 2 hours | Config change, text update |
| 2 | Simple | 2–4 hours | Add field to existing form |
| 3 | Moderate | 4–8 hours | New simple endpoint |
| 5 | Complex | 1–2 days | New feature, one domain |
| 8 | Very Complex | 2–4 days | Cross-domain feature |
| 13 | Epic | > 4 days | Must be decomposed |

## Escalation

| Issue | Escalate To | Response Time |
|-------|------------|---------------|
| Production outage | Tech Lead → Architect → CTO | < 15 min |
| Blocked > 4 hours | Tech Lead | < 1 hour |
| Scope change needed | Product Manager | < 1 day |
| Technical disagreement | Architect | < 2 days |
