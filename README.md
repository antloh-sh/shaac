# AAC Staff Portal

Internal single-page web app for Active Ageing Centre (AAC) staff: member lookup, activity reporting, and data imports. Hosted on GitHub Pages, backed by Supabase (Postgres, Auth, Edge Functions).

**Live app:** https://antloh-sh.github.io/shaac/

---

## Contents

1. [Features by role](#features-by-role)
2. [Using the app](#using-the-app)
3. [Access control and sign-in](#access-control-and-sign-in)
4. [Repository layout](#repository-layout)
5. [Supabase backend](#supabase-backend)
6. [Security model](#security-model)
7. [Operations runbook](#operations-runbook)
8. [Dependencies](#dependencies)
9. [Known limitations and open items](#known-limitations-and-open-items)

---

## Features by role

| Tab | Staff | Admin | Purpose |
| :--- | :---: | :---: | :--- |
| Search | yes | yes | Look up members; view NOK, household and activity history |
| Reports | - | yes | Activity reports, attendance report, inactive members |
| Members | - | yes | Upload member and family CSV files |
| Activities | - | yes | Transform and upload activity attendance data |

Roles live in `profiles.role` (`admin` or `staff`). Hidden tabs are a convenience only; every admin function is also enforced in the database (see [Security model](#security-model)).

Every signed-in user also sees a **Last Data Sync** bar above the tabs: the date of the last member import, and the date of the most recent activity on record.

---

## Using the app

### Member Search (all users)

- Search by name, alias, NRIC or phone number. Minimum 2 characters, maximum 100.
- A search must match **5 members or fewer**. Broader searches return "Too many results" and ask you to refine.
- Each result card shows name (and alias), a red **Terminated** label where applicable, gender, date of birth, NRIC, phone, address, and whether the member lives within the service boundary.
- Buttons on each card (click again to collapse):
  - **NOK** - next-of-kin contacts.
  - **Household** - other members sharing the same household ID, with gender, age, date of birth and phone. Terminated members are flagged. The button and a count badge appear only when there are other household members.
  - **Activities** - every activity the member has attended, latest first (scrolls after about 5 rows).

### Reports (admin)

The Reports tab has three sub-tabs. Month pickers keep the end month on or after the start month. Browsers without a native month picker (Firefox desktop) get Month and Year dropdowns instead.

**Activity Reports** - choose a report and a month range, then Execute Query. Scalar results show as a large number; tabular results show as a table with **Export as CSV**. Reports are defined in `reports.json`:

| Report ID | Display name |
| :--- | :--- |
| `get_gui_session_count` | GUI Session Count |
| `get_gui_activity_breakdown` | GUI Activity List |
| `get_gui_unique_member_count_in_boundary` | GUI Unique Members (In Boundary, Age 60+) |
| `count_robust_members_activity` | Engaged Robust Seniors (In Boundary, 60+, CFS 1-3, 2+ sessions) |
| `count_frail_members_activity` | Engaged Frail Seniors (In Boundary, 60+, CFS 4 and 5, 6+ sessions) |
| `members_cfs_678_activity` | Engaged CFS 6~8 Seniors (In Boundary, 60+, CFS 6, 7 and 8, 2+ sessions) |
| `list_active_seniors_without_cfs` | Active Seniors without CFS (In Boundary, 60+, 1+ sessions) |
| `get_all_cfs_breakdown` | Activity Session Count and CFS Averages (all members) |
| `get_member_activity_summary` | Member Activity Summary (In Boundary, 60+) |

**Attendance** - pick one activity (list loaded from the data), a month range, and optionally "In-boundary members only". Output: name, NRIC, phone and number of sessions in the range, sorted by sessions. Includes Joined members and Terminated members who attended (flagged "Terminated"). Export as CSV sits above the table.

**Inactive** - members with no activity since a cutoff:
- **Since start of current FY** (financial year runs 1 April to 31 March), or
- **Enter number of months** (1 or more) counted back from today.

Optional in-boundary filter. Joined members only. Output: name, NRIC, phone, last activity date (**Never** if the member has no attendance on record), and total sessions. Sorted longest-inactive first, never-attended at the top. CSV export available.

### Members sync (admin)

Upload either or both files, then Upload and Sync. Each file is parsed in the browser, validated, and sent to the database.

| File | Source columns used | Behaviour |
| :--- | :--- | :--- |
| AACMemberDetails CSV | `RegistrationDocumentNumber`, `FullNameNative`, `ToAddressAs`, `DateOfBirth`, `Gender`, `Phone`, `ResidesWithinServiceBoundaryStr`, `FullAddress`, `CurrentMembershipStatus` | Upsert by NRIC through a staging table. Membership status comes from this file. |
| FamilyMembersListing CSV | `Patient_NRIC_Fin_Passport_No___`, `Family_Member_Name__`, `Relationship____To_follow_ILTC_Master_List_`, `Home_Phone`, `Mobile_Phone` | For every member present in the file, existing family rows are replaced by the new list. |

### Activities ETL (admin)

Select three files and click Transform and Sync. Everything is transformed in the browser; only the final rows are sent to the database.

1. **Activity Master** (`.xlsx`) - needs `Activity` (or `ActivityDisplay`), `GUI` and `AAP` columns.
2. **CPR file** (`.xlsx`) - header row located automatically (`UIN / NRIC`, `CFS (1-9)`).
3. **Attendance** (`.csv`) - raw export; only rows with `Attendance = 1` are used.

Rules applied:
- Activities whose `AAP` is not "Yes" in the Activity Master are excluded.
- `GUI` "Yes..." becomes `true`.
- Activity name is cut to its first line; dates `DD-Mon-YYYY` become `YYYY-MM-DD`.
- CFS is joined from the CPR file by NRIC.
- Rows with a missing NRIC or an unparseable date are skipped and counted.
- Upserts run in batches of 500 with progress, keyed on date + activity + NRIC, so re-uploading the same file is safe.
- The result message reports rows upserted and rows skipped by reason (absent, non-AAP, missing NRIC, bad date).

### Weekly birthday email (automatic)

A Supabase Edge Function (`birthday-notifier`) emails the admin a list of **Joined** members with birthdays in the next 30 days: name, birthday, age they are turning, days away, and service-boundary status. It is triggered by a `pg_cron` job (`weekly-birthday-notifier`, originally Mondays 09:00 Singapore time; check `cron.job` for the live schedule) and sends through Resend. No email is sent when there are no birthdays.

---

## Access control and sign-in

- **Accounts are invite-only.** Public sign-up and anonymous sign-ins are switched off in Supabase.
- **New staff** receive an invitation email. The link opens the app and forces a **Set New Password** screen before anything else loads. The gate is `profiles.has_set_password`; the app treats anything other than an explicit `true` as "not set up yet".
- New accounts default to the `staff` role. Admins are promoted manually (see runbook). A database trigger blocks anyone from changing a `role` from inside the app; dashboard and SQL Editor edits still work.
- **Forgot Password** sends a reset link back to the app.
- **Sessions** use `sessionStorage` (closing the tab signs you out) and auto-logout after **15 minutes** of inactivity.
- Sign-in attempts are rate limited in Supabase Auth (5 requests per 5 minutes per IP).
- Password rules in the app: 6 to 72 characters. The show/hide toggle re-hides itself after 5 seconds.

---

## Repository layout

| File | Description |
| :--- | :--- |
| `index.html` | The whole app: markup, styles and client logic (auth, search, reports, imports) |
| `auth-config.js` | Supabase client setup (project URL and publishable key), session storage, idle timer, sign-out |
| `reports.json` | Report definitions shown in the Activity Reports dropdown |
| `README.md` | This file |

Deployment: GitHub Pages, served from the repository root. Push to the published branch and wait for Pages to rebuild.

`auth-config.js` contains only the project URL and the **publishable** key, which is designed to be public. The service-role key must never be committed; it lives only in Supabase (Edge Function secrets and the cron job).

---

## Supabase backend

Everything below lives in Supabase, not in this repository. Keep SQL changes in your own migration notes.

### Main tables

| Table | Purpose |
| :--- | :--- |
| `aac_member_details` | Members (NRIC primary key, including `householdid` and `currentmembershipstatus`) |
| `aac_member_details_staging` | Truncated and refilled on each member import |
| `family_members_listing` (+ `_staging`) | Next-of-kin records, linked to members by NRIC |
| `activities` | Attendance rows; unique on activity date + activity name + NRIC |
| `profiles` | One row per user: `role`, `username`, `has_set_password` |
| `sync_metadata` | Last-sync dates shown in the sync bar (written only by the import functions) |

### Functions the front end calls

| Function | Who can call it |
| :--- | :--- |
| `search_members_generic`, `get_member_nok` | Signed-in staff and admins (runs with the caller's RLS) |
| `get_household_members`, `get_member_activities`, `get_sync_metadata` | Signed-in staff and admins |
| Reports in `reports.json`, `get_activity_names`, `get_activity_attendance_report`, `get_inactive_members` | Admin only |
| `import_and_merge_members`, `import_and_merge_family`, `import_and_merge_activity` | Admin only |
| `get_upcoming_birthdays` | Admin, or the service role (used by the Edge Function) |

Helpers: `is_admin()`, `get_my_role()`, `get_user_role()`, trigger functions `handle_new_user` (creates a `staff` profile for every new user) and `prevent_role_escalation`.

### Auth settings (Supabase dashboard)

- Authentication > Sign In / Providers: **Allow new users to sign up = off**, **Allow anonymous sign-ins = off**.
- Authentication > URL Configuration: **Site URL** and the redirect list must be `https://antloh-sh.github.io/shaac/`. Invite and reset links go to the Site URL; if it points elsewhere, users land on the wrong page.
- The built-in email sender is rate limited (about 2 emails per hour on the free plan). Invite people one at a time, or configure custom SMTP.

---

## Security model

The browser is never trusted. Hiding a tab does not protect data; the database does.

- **Admin functions check the caller's role themselves** (`IF NOT is_admin() THEN RAISE EXCEPTION ...`), so calling them from the browser console as a staff user fails.
- **No anonymous access.** `EXECUTE` is revoked from `PUBLIC` and `anon` on every data function. `REVOKE ... FROM anon` alone is not enough, because `anon` inherits `PUBLIC`.
- **Row Level Security** is enabled on the data tables. Staff have read-only access to member and next-of-kin tables; admins have full access.
- **Role changes** from inside the app are blocked by the `prevent_role_escalation` trigger.
- **XSS defence.** All database values are escaped (`sanitise()`) before being written into the page.
- **Supply chain.** Third-party scripts are pinned to exact versions with Subresource Integrity hashes.
- **Sessions** are per-tab and expire after 15 minutes idle.

Accepted by design:
- The publishable key is public. Its safety rests on the database rules above.
- Staff can see next-of-kin contacts (they need them from the search card).
- `has_set_password` is writable by the signed-in user, because the app sets it after the password is saved. It is a usability gate, not a security boundary.

---

## Operations runbook

**Invite a new staff member**
1. Supabase > Authentication > Users > Invite user.
2. They click the link, set a password, and land in the app as `staff`.
3. To make them an admin: Table Editor > `profiles` > set `role` to `admin`.

**Monthly data refresh**
1. Members tab: upload the member and family CSVs.
2. Activities tab: upload the Activity Master, CPR and attendance files.
3. Confirm the Last Data Sync bar shows the new dates.

**Add a report**
1. Create the function with parameters `(start_date date, end_date date)`.
2. Put the admin check as its first statement.
3. Revoke access from `PUBLIC` and `anon`, grant to `authenticated`:
   `REVOKE EXECUTE ON FUNCTION f(date, date) FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION f(date, date) TO authenticated;`
4. Add an entry to `reports.json` (`id` must equal the function name). A scalar result shows as a big number; a table result shows as a table with CSV export.
5. In functions that use `RETURNS TABLE`, qualify column names with a table alias to avoid "column reference is ambiguous" errors.

**Update a CDN library**
Change to a new exact version, generate its SRI hash (for example at srihash.org), and update both the URL and the `integrity` attribute. A mismatched hash blocks the script and breaks sign-in.

**Check who has access**
```sql
SELECT u.email, u.invited_at, u.last_sign_in_at, p.role, p.has_set_password
FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
```

**Troubleshooting**
- *Sign-in button does nothing:* open the browser console; usually a script failed to load (wrong integrity hash) or the file has a syntax error.
- *Report shows 0 or "Access denied":* check the signed-in user is `admin` and the function's privileges.
- *Invite or reset link opens the wrong page:* check the Site URL and redirect list.
- *Birthday email missing:* check Edge Functions > `birthday-notifier` > Logs for a 200.

---

## Dependencies

| Library | Version | Use |
| :--- | :--- | :--- |
| `@supabase/supabase-js` | 2.80.0 | Auth, queries, RPC calls |
| PapaParse | 5.3.2 | CSV parsing |
| SheetJS (`xlsx`) | 0.18.5 | Excel parsing for the Activities ETL |

All three load from a CDN with pinned versions and SRI hashes.

---

## Known limitations and open items

- **No Content-Security-Policy.** GitHub Pages cannot set custom response headers. Output escaping and pinned scripts are the mitigations.
- **The 5-result search cap is a usability limit, not a privacy control.** Staff can read the member tables through RLS. Enforcing the cap would mean removing direct staff table access and routing everything through guarded functions.
- **Inactive report, "Total Sessions" column.** It counts sessions on or after the cutoff date. Members listed have no activity since the cutoff, so it is always 0 for them. What this column should show is still to be decided.
- **Free-tier projects can be paused after a period of inactivity.** The scheduled job helps keep the project active but is not a guarantee.
