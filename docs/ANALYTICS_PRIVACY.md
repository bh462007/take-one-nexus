# Analytics Privacy & Anonymization Documentation

## Overview

TAKE ONE Nexus is committed to protecting user privacy while using analytics to improve platform performance, usability, and reliability.

Analytics data is collected in a way that minimizes exposure of personally identifiable information (PII) and focuses on aggregated platform insights.

---

## Data Collection Principles

The platform follows these principles when collecting analytics:

- Collect only data necessary for product improvement.
- Avoid storing personally identifiable information whenever possible.
- Use aggregated metrics for reporting and decision-making.
- Limit access to analytics data to authorized personnel only.

---

## Types of Analytics Data

The platform may collect:

### Usage Metrics

- Page visits
- Feature usage frequency
- Session duration
- Navigation patterns

### Performance Metrics

- Page load times
- API response times
- Error rates
- System availability metrics

### Operational Metrics

- Deployment health
- Service uptime
- Application logs
- Infrastructure monitoring data

---

## Privacy Protection

The following privacy safeguards should be applied:

- Sensitive user information must not be included in analytics events.
- Authentication credentials must never be logged.
- Personal content should not be used for analytics processing.
- Access to analytics dashboards should be restricted.

---

## Data Anonymization

Where analytics collection is required, the following anonymization practices are recommended:

- Remove direct personal identifiers.
- Use aggregated reporting whenever possible.
- Minimize retention of identifiable event data.
- Apply anonymization before long-term storage.

---

## Hash Truncation Strategy

### Current Implementation

The platform uses a truncated SHA-256 hash for visitor identification:

- **Algorithm**: SHA-256 (Salted)
- **Truncation**: First 16 hexadecimal characters (64 bits)
- **Purpose**: Anonymize IP addresses while maintaining visitor uniqueness and preventing dictionary attacks
- **Implementation**: `crypto.createHash('sha256').update(String(ip) + process.env.JWT_SECRET).digest('hex').substring(0, 16)`

### Collision Probability Analysis

- **Theoretical Collision Risk**: With 64 bits of entropy, the birthday paradox suggests a 50% collision probability after approximately 4.2 billion unique values
- **Practical Assessment**: For a platform with thousands to millions of visitors, 64 bits provides sufficient uniqueness
- **Storage Efficiency**: 16 characters vs 64 characters for full SHA-256 (75% reduction)
- **Privacy Protection**: Truncation prevents reconstruction of original IP addresses

### Recommendation

**Status**: Current 16-character truncation is appropriate for the platform's scale and privacy requirements.

**Justification**:
- Sufficient uniqueness for current and projected user base
- Strong privacy protection through irreversible truncation
- Efficient storage and indexing
- No changes required unless platform scales to billions of unique visitors

---

## Data Retention Policy

### Current State

- **Retention Period**: No explicit retention policy (data retained indefinitely)
- **Impact**: Unbounded storage growth, potential privacy concerns over time

### Recommended Retention Periods

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Raw analytics events (profile_view, portfolio_view, project_engagement) | 90 days | Sufficient for trend analysis and debugging |
| Aggregated daily/weekly metrics | 1 year | Supports long-term product decisions |
| User-level analytics summaries | 1 year | Balances user insights with privacy |
| Performance metrics | 6 months | Operational monitoring window |

### Data Lifecycle Management

1. **Automatic Cleanup**: Implement scheduled cleanup jobs to delete expired data
2. **Archival**: Consider archiving aggregated metrics before deletion
3. **User Control**: Provide mechanism for users to request analytics data deletion
4. **Audit Trail**: Log data deletion activities for compliance

### Implementation Priority

- **High**: Add retention period configuration
- **High**: Implement automatic cleanup job
- **Medium**: Add user-facing data deletion request
- **Low**: Implement archival system

---

## Security Considerations

Analytics systems should follow the project's security standards:

- Secure transmission of analytics data.
- Access control for analytics platforms.
- Audit logging for administrative access.
- Periodic review of collected metrics.

---

## Compliance

Contributors implementing analytics features should ensure compliance with:

- Applicable privacy regulations
- Project security policies
- Internal data handling standards

---

## Contributor Guidance

When adding analytics-related features:

1. Collect the minimum required data.
2. Avoid storing personal information.
3. Document newly introduced analytics events.
4. Review privacy implications before deployment.
5. Consider retention periods for new data types.

---

## Review Schedule

This analytics strategy should be reviewed:
- **Quarterly**: Assess data growth and storage metrics
- **Annually**: Full review of hash truncation and retention policies
- **On Scale Events**: When user base grows by 10x or reaches new milestone

---

TAKE ONE Nexus values user privacy and encourages privacy-first development practices across the platform.
