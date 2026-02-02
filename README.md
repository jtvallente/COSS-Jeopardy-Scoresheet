# COSS Jeopardy Scoresheet
## Complete Setup & Operation Manual
**Local Network / LAN / Hotspot Version**

---

## 1. What This System Is

This system is a **local-network, real-time Jeopardy scoring system**.

- One laptop = **Host / Server**
- Up to 8 devices = **Proctors**
- Optional display device = **Leaderboard / Public screen**
- All devices connect to the **same Wi-Fi or hotspot**
- **No internet is required** once set up
- Scores update live (**Socket.IO**)
- Reloading browsers is safe
- **Stopping the server is NOT safe** without backups

---

## 2. Required Roles

### Game Master (Host)
- Runs the server and client
- Controls the game flow
- Manages teams, assignments, rounds
- Has Controller access

### Proctors (8 max)
- Each proctor scores only assigned teams
- Uses a phone, tablet, or laptop
- Does not control game state

---

## 3. Hard Requirements (DO NOT SKIP)

### Hardware
- Host laptop (Mac / Windows / Linux)
- 8 phones or laptops for proctors
- Power source (host laptop must stay plugged in)

### Network
All devices must be on **ONE network**:
- Recommended: Mobile Hotspot (iPhone / Android)
- Venue Wi-Fi can fail due to client isolation

---

## 4. Cloning & Preparation

### Step 4.1 — Clone or Copy the Project
On the Host laptop:

~~~bash
git clone https://<github-token>@github.com/jtvallente/COSS-Jeopardy-Scoresheet.git
cd COSS-Jeopardy-Scoresheet
~~~

You must see:

~~~
/client
/server
package.json (root)
~~~

### Step 4.2 — Install Dependencies (ROOT ONLY)
From the project root:

~~~bash
npm run install:all
~~~

If that script does not exist:

~~~bash
npm --prefix server install
npm --prefix client install
~~~

---

## 5. Server Configuration (CRITICAL)

### Step 5.1 — Create Server Environment File
Create this file:

~~~
server/.env
~~~

Contents:

~~~env
GAME_ID=JPD2026
PORT=4000
~~~

`GAME_ID` is:
- Case-sensitive
- Shared verbally with GM + proctors
- Required to enter the system

### Step 5.2 — Bind Server to LAN (VERY IMPORTANT)
Open:

~~~
server/src/index.js
~~~

At the bottom, ensure this exact code exists:

~~~js
const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});
~~~

- This allows phones on Wi-Fi to connect
- If you bind to localhost, phones will fail

---

## 6. Client Configuration (LAN IP)

### Step 6.1 — Determine Host IP
On the Host laptop (Mac):
- System Settings → Network → Wi-Fi → Details → IP Address  
Example: `192.168.1.18`

### Step 6.2 — Create Client Environment File
Create:

~~~
client/.env.local
~~~

Contents (replace IP):

~~~env
VITE_API_URL=http://192.168.1.18:4000/api
VITE_SOCKET_URL=http://192.168.1.18:4000
~~~

**DO NOT** use localhost here. Use the IP address of your current network.

---

## 7. Running Everything From Root (Event Mode)

From project root:

~~~bash
npm run dev
~~~

This runs:
- Server on `4000`
- Client on `5173` with `--host`

You should see output similar to:
- `API running on http://0.0.0.0:4000`
- `VITE ready`
- `Local: http://localhost:5173`
- `Network: http://192.168.1.18:5173`

---

## 8. Network Check (Mandatory Before Event)

### Step 8.1 — Test API From Host
On host browser:

~~~
http://192.168.1.18:4000/api/health
~~~

Must show:

~~~json
{ "ok": true }
~~~

### Step 8.2 — Test From Phone
On proctor phone (same Wi-Fi):

~~~
http://192.168.1.18:5173
~~~

If this loads → network OK.

If `/api/health` fails:
- Turn OFF Mac firewall temporarily
- Ensure same Wi-Fi
- Ensure server is running

---

## 9. Joining the Game (All Users)

Base URL (share this):

~~~
http://192.168.1.18:5173
~~~

Join page steps:
1. Enter Game ID (e.g. `JPD2026`)
2. Press Join

- If Game ID is wrong → entry denied
- If correct → user enters system
- Game ID is stored in browser storage (reload-safe)

---

## 10. Page-by-Page Functional Guide

### 10.1 Join Page
- First page for everyone
- Validates Game ID
- Redirects to Controller by default
- Safe to reload

### 10.2 Controller Page (Game Master Only)
Purpose: Control the entire game flow

Controls:
- Phase: EASY / AVERAGE / DIFFICULT / TIE_BREAKER
- Clue number
- Clue value (EASY / AVERAGE)
- Open / Close scoring
- Open / Close bets (DIFFICULT)
- Start tie-breaker clue
- Undo last action
- Reset game (destructive)

Rules enforced:
- Bets only allowed in DIFFICULT
- Scoring disabled when closed
- Tie-breaker requires GM confirmation on conflicts

### 10.3 Teams Page
Purpose: Manage team list

Features:
- Add teams manually
- Import via CSV / text
- Replace or append teams
- Teams ordered by seating (left → right)

Max teams: 40

### 10.4 Assignments Page
Purpose: Assign teams to proctors

Options:
- Manual assignment
- Auto-assign (seat order)

Auto-assign logic:
- 8 proctors
- Max 5 teams per proctor
- Even distribution

Once assigned:
- Proctors ONLY see their teams

### 10.5 Proctor Page (`/proctor/p1` to `/p8`)
Purpose: Score teams

What proctors see:
- Assigned teams only
- Team score
- Disqualification status
- Current phase

Actions:
- ✅ Correct
- ❌ Wrong
- — No Answer

DIFFICULT round:
- Bet input enabled ONLY when GM opens bets
- Bet must be ≤ team score
- Submit per team

Disqualification:
- Teams with score ≤ 0 at DIFFICULT start are marked ELIM
- All inputs disabled for eliminated teams

Reloading page is safe.

### 10.6 Leaderboard Page
Purpose: Ranking and public display
- Sorted descending
- Gold / Silver / Bronze top 3
- Modal showing Top 10
- Can be displayed on projector / TV

---

## 11. Game Flow & Scoring Rules

### EASY
- Correct: +value
- Wrong: 0
- No Answer: 0

### AVERAGE
- Correct: +value
- Wrong: −value
- No Answer: 0

### DIFFICULT
- Teams with score ≤ 0 → disqualified
- Bet required
- Correct: +bet
- Wrong: −bet

### TIE-BREAKER
- First correct wins (buffer window)
- If conflict → GM resolves
- Winner gets +1

---

## 12. Data Persistence & Safety (Read Carefully)

Safe:
- Browser refresh
- Phone reconnect
- Wi-Fi drop (temporary)

Unsafe (data loss):
- Server process stops
- Host laptop sleeps/shuts down
- Power loss
- Nodemon restart

All game data is in RAM.

---

## 13. Recommended Operational Safety

Before event:
- Plug in laptop
- Disable sleep
- Test with at least 2 phones
- Confirm `/api/health`

During event:
- Do not close terminal
- Do not edit code
- Avoid Wi-Fi switching

---

## 14. Backup Strategy
(To be defined)

---

## 15. Final Checklist

- Server running (4000)
- Client running (5173)
- `/api/health` works
- All devices on same Wi-Fi
- Game ID confirmed
- Laptop plugged in
- Sleep disabled
