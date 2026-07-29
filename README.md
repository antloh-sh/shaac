# AAC Staff Portal

A single-page web application designed for Active Ageing Centre (AAC) staff to manage member searches, process data imports and ETL workflows, and execute key reporting metrics.

---

## Overview

The **AAC Staff Portal** provides a central dashboard for centre staff to perform member lookups, synchronize membership and activity records, and generate standardized reports on senior engagement and Clinical Frailty Scale (CFS) classifications.

### Key Features

* **Authentication & Access Control**
  * Email and password sign-in.
  * Password recovery flow and forced password update for new users.
  * Role-based tab visibility (Admin access for reports and ETL utilities).
  * Inactivity timeout with auto-logout after 15 minutes.
* **Member Search**
  * Search members by Name, NRIC, or Phone Number.
  * View member demographics, current status, full address, Next of Kin (NOK) contact details, and household member summaries.
* **Activity Reporting**
  * Execute reports across custom date ranges (Start Month to End Month).
  * Display aggregated metrics and tabular data for attendance, GUI activities, and CFS categories.
* **Database Sync & ETL**
  * **Members Sync:** Parse, validate, and upload `AACMemberDetails` and `FamilyMembersListing` CSV files.
  * **Activities ETL:** Merge and transform Activity Master (XLSX), CPR (XLSX), and Attendance (CSV) files with batch upserting.

---

## File Structure

| File | Description |
| :--- | :--- |
| `index.html` | Core HTML structure, styling, UI tabs, and client-side logic for authentication, member search, reporting, and ETL functions. |
| `auth-config.js` | Supabase client initialization, `sessionStorage` session persistence settings, and inactivity timer handling. |
| `reports.json` | JSON configuration file defining available report RPC identifiers and human-readable names. |

---

## Available Reports

The reporting module loads configuration from `reports.json` and connects to the following backend RPC functions:

| Report ID | Display Name | Description |
| :--- | :--- | :--- |
| `get_gui_session_count` | **GUI Session Count** | Total session count for GUI activities. |
| `get_gui_activity_breakdown` | **GUI Activity List** | Itemized list of GUI activity sessions. |
| `get_gui_unique_member_count_in_boundary` | **GUI Unique Members (In Boundary, Age 60+)** | Count of unique in-boundary seniors aged 60+ attending GUI activities. |
| `count_robust_members_activity` | **Engaged Robust Seniors** | In-boundary seniors aged 60+ with CFS 1–3 attending 2+ sessions. |
| `count_frail_members_activity` | **Engaged Frail Seniors** | In-boundary seniors aged 60+ with CFS 4–5 attending 6+ sessions. |
| `members_cfs_678_activity` | **Engaged CFS 6~8 Seniors** | In-boundary seniors aged 60+ with CFS 6–8 attending 2+ sessions. |
| `list_active_seniors_without_cfs` | **Active Seniors without CFS** | Active in-boundary seniors aged 60+ with no CFS score attending 1+ sessions. |
| `get_all_cfs_breakdown` | **Activity Session Count & CFS Averages** | Overview of total activity sessions and CFS averages across all members. |

---

## Dependencies & Libraries

* **Supabase JS Client (`@supabase/supabase-js` v2.80.0):** Database queries, authentication, and RPC operations.
* **PapaParse (`papaparse` v5.3.2):** CSV parsing for member imports and activity attendance.
* **SheetJS (`xlsx` v0.18.5):** Excel file parsing for Activity Master and CPR files.
