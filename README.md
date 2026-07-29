# AAC Staff Portal

A single-page web application designed for Active Ageing Centre (AAC) staff to manage member searches, process data imports and ETL workflows, and execute key reporting metrics[cite: 2].

---

## Overview

The **AAC Staff Portal** provides a central dashboard for centre staff to perform member lookups, synchronize membership and activity records, and generate standardized reports on senior engagement and Clinical Frailty Scale (CFS) classifications[cite: 1, 2].

### Key Features

* **Authentication & Access Control**
  * Email and password sign-in[cite: 2].
  * Password recovery flow and forced password update for new users[cite: 2].
  * Role-based tab visibility (Admin access for reports and ETL utilities)[cite: 2].
  * Inactivity timeout with auto-logout after 15 minutes[cite: 3].
* **Member Search**
  * Search members by Name, NRIC, or Phone Number[cite: 2].
  * View member demographics, current status, full address, Next of Kin (NOK) contact details, and household member summaries[cite: 2].
* **Activity Reporting**
  * Execute reports across custom date ranges (Start Month to End Month)[cite: 2].
  * Display aggregated metrics and tabular data for attendance, GUI activities, and CFS categories[cite: 1, 2].
* **Database Sync & ETL**
  * **Members Sync:** Parse, validate, and upload `AACMemberDetails` and `FamilyMembersListing` CSV files[cite: 2].
  * **Activities ETL:** Merge and transform Activity Master (XLSX), CPR (XLSX), and Attendance (CSV) files with batch upserting[cite: 2].

---

## File Structure

| File | Description |
| :--- | :--- |
| `index.html`[cite: 2] | Core HTML structure, styling, UI tabs, and client-side logic for authentication, member search, reporting, and ETL functions[cite: 2]. |
| `auth-config.js`[cite: 3] | Supabase client initialization, `sessionStorage` session persistence settings, and inactivity timer handling[cite: 3]. |
| `reports.json`[cite: 1] | JSON configuration file defining available report RPC identifiers and human-readable names[cite: 1]. |

---

## Available Reports

The reporting module loads configuration from `reports.json` and connects to the following backend RPC functions[cite: 1, 2]:

| Report ID | Display Name | Description |
| :--- | :--- | :--- |
| `get_gui_session_count`[cite: 1] | **GUI Session Count**[cite: 1] | Total session count for GUI activities[cite: 1]. |
| `get_gui_activity_breakdown`[cite: 1] | **GUI Activity List**[cite: 1] | Itemized list of GUI activity sessions[cite: 1]. |
| `get_gui_unique_member_count_in_boundary`[cite: 1] | **GUI Unique Members (In Boundary, Age 60+)**[cite: 1] | Count of unique in-boundary seniors aged 60+ attending GUI activities[cite: 1]. |
| `count_robust_members_activity`[cite: 1] | **Engaged Robust Seniors**[cite: 1] | In-boundary seniors aged 60+ with CFS 1–3 attending 2+ sessions[cite: 1]. |
| `count_frail_members_activity`[cite: 1] | **Engaged Frail Seniors**[cite: 1] | In-boundary seniors aged 60+ with CFS 4–5 attending 6+ sessions[cite: 1]. |
| `members_cfs_678_activity`[cite: 1] | **Engaged CFS 6~8 Seniors**[cite: 1] | In-boundary seniors aged 60+ with CFS 6–8 attending 2+ sessions[cite: 1]. |
| `list_active_seniors_without_cfs`[cite: 1] | **Active Seniors without CFS**[cite: 1] | Active in-boundary seniors aged 60+ with no CFS score attending 1+ sessions[cite: 1]. |
| `get_all_cfs_breakdown`[cite: 1] | **Activity Session Count & CFS Averages**[cite: 1] | Overview of total activity sessions and CFS averages across all members[cite: 1]. |

---

## Dependencies & Libraries

* **Supabase JS Client (`@supabase/supabase-js` v2.80.0):** Database queries, authentication, and RPC operations[cite: 2].
* **PapaParse (`papaparse` v5.3.2):** CSV parsing for member imports and activity attendance[cite: 2].
* **SheetJS (`xlsx` v0.18.5):** Excel file parsing for Activity Master and CPR files[cite: 2].
