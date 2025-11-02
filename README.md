# Sentinel 

![Sentinel Architecture](https://github.com/user-attachments/assets/9f872e33-3233-4f3f-91c6-28ce6b3cb165)
---

## Introduction

**Sentinel** is a blockchain-backed platform that makes open-source collaboration **trustless, fair, and secure**. It combines a **two-sided staking protocol** (for both repository owners and issue solvers) with **verifiable AI agents** and **Polkadot zk-based user verification** to eliminate collusion, overruns, Sybil attacks, and identity fraud.

**Deployed on:** Polkadot’s **Moonbase parachain**

This ensures predictable incentives, protected contributors (especially new developers), and verified AI assistance — all enforced through smart contracts and on-chain identity proofs.

---

## The Problem

* **Collusion and code appropriation:** Maintainers may view PRs and reuse code without merging or rewarding contributors.
* **Incentive misalignment:** Experienced developers can unintentionally overrun newcomers’ PRs, leading to unfair outcomes.
* **Centralized trust dependency:** Platforms like Gitcoin depend on manual fund releases by maintainers.
* **Fake accounts and Sybil attacks:** Multiple identities distort fairness and reward distribution.
* **Unverified human contribution:** Without verified identities, human participation cannot be proven.

---

## High-Level Solution

Sentinel enforces fairness and transparency through:

1. **Two-Sided Staking** — Both owners and solvers lock tokens; stakes are returned or slashed based on verified outcomes.
2. **Smart Contract ↔ GitHub API Reconciliation** — Each issue corresponds to a contract struct synchronized with GitHub metadata, detecting off-platform merges or policy violations.
3. **Verifiable AI Agents** — Auditable AI models assist in PR review and code evaluation. Their actions and reputations are tracked on-chain.

---

## How Staking Works

### Why Project Owners Stake

* **Prevent collusion or copying:** Owners cannot bypass contributor PRs without losing their stake.
* **Prevent unauthorized merges:** Only assigned contributors’ PRs can be merged; mismatches trigger slashing.
* **Align incentives:** Owners are economically motivated to follow Sentinel's workflow, ensuring fairness.

### Why Solvers (Contributors) Stake

* **Sybil resistance:** Staking deters spam and fake registrations.
* **Exclusive assignment:** Stakers gain exclusive rights and deadlines to resolve issues.
* **Beginner protection:** Unstaked overruns are excluded from rewards, ensuring fair opportunity.
* **Verified identity:** zk-based verification proves genuine human participation.

---

## Release and Slashing Rules

* Each issue is a smart contract struct containing metadata and state.
* Owner stakes are released only when all associated issues are resolved and validated.
* Off-platform actions, unauthorized merges, or violations lead to slashing or redistribution of stakes.

---

## Verifiable AI Layer

* **Auditable computation:** AI agents generate outputs backed by verifiable proofs.
* **Reputation system:** Agent performance and trust metrics are stored on-chain, influencing task selection.
* **Collaborative review:** Multiple AI agents analyze PRs collectively to produce verifiable recommendations.

---

## Why Sentinel Is Better Than Traditional Platforms

* **Automated fairness:** Smart contracts handle reward release without manual intervention.
* **Beginner protection:** Deadline-based staking ensures fair competition.
* **Verified human contribution:** zk-based identity proofs confirm authenticity.
* **Sybil and DoS resistance:** Contributor staking and nullifier checks prevent abuse.
* **Transparent AI:** All AI decisions are auditable and verifiable on-chain.

---

## Tech Stack

* **Blockchain:** Polkadot’s **Moonbase parachain** (staking, issue management, reward distribution).
* **Identity Layer:** Polkadot zk-based verification using nullifiers and privacy-preserving proofs.
* **AI Agents:** Distributed verifiable agents for code analysis, PR evaluation, and trust scoring.
* **GitHub Integration:** Smart contract state continuously reconciled with GitHub issue and PR data.

---

## Summary

Sentinel brings **trustless accountability** to open-source collaboration through a hybrid of **staking, verifiable AI**. By ensuring that every contribution is genuine, auditable, and economically aligned, Sentinel restores transparency, fairness, and trust to the open-source ecosystem.

