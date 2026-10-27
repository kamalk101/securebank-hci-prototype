# Screen map

How the two builds line up with the report. Annotation pins in each build show
these points on the phone.

| # | Screen | Good build — what to point at | Bad build — what is wrong | Report |
| --- | --- | --- | --- | --- |
| 1 | Login | Inline "Incorrect password. 2 attempts left."; fingerprint fallback; anti-scam notice | `ERROR 401: INVALID_CREDENTIALS`; "remember password on this public computer"; competing SUBMIT / Login / Reset and an advert | §4.3.1, §5.1.1 |
| 2 | Home | Balance dominates and can be hidden; four quick actions; per-row status | Twelve equal links; offers above banking; 8 px text and internal jargon | §4.3.2, §5.1.2 |
| 3 | Send money | Saved beneficiaries; numeric amount with limit check; one primary action | Branch code, purpose, CNIC, remarks; no validation; "Step 1 of ?" | §4.3.3, §5.1.3 |
| 4 | Review & OTP | Grouped summary; irreversible-action warning; 6-box OTP with resend timer | "Transaction may or may not have completed"; Total "?"; "ARE YOU SURE???" | §4.3.4, §5.1.4 |
| 5 | History | Search + category chips; day headings; sign, colour, and text status | Five date formats; one-letter status column; account/period round trip before data | §4.3.5, §5.1.5 |
| 6 | Bills | Categories and search; saved biller with consumer number; review dialog | 45-item dropdown with duplicates; "(maybe)" due date and fees; no confirmation | §4.3.6, §5.1.6 |
| 7 | Cards | Card visual reflects freeze/block; toggles give feedback; separate destructive block flow | Full number and PIN on screen; "ACTIVE (or maybe blocked)"; Freeze / Disable / Lock | §4.3.7, §5.1.7 |
| 8 | Settings | Text size with preview; contrast and motion as first-class settings; account actions separated at the end | "Changes may or may not be saved"; "ON (international, maybe off)"; delete account in the ordinary list | §4.3.8, §5.1.8 |
| 9 | Support | Presence and reply time; quick topics; visible route to a human | Online and unavailable at once; `CHAT_SESSION_TIMEOUT (code 504)`; no ticket or transcript | §4.3.9, §5.1.9 |

## Cross-screen material

| Topic | Where | Report |
| --- | --- | --- |
| Visual hierarchy, consistency, chunking, formatting | All screens, especially Home and History | §4.4.1, §4.4.4 |
| Shneiderman's golden rules (feedback, error prevention, closure) | Login, Transfer, Review, Cards | §4.4.2 |
| Interaction models (direct manipulation, recognition over recall, constraints) | Beneficiaries, toggles, OTP, billers | §4.4.3 |
| Distributed behaviour: pending states, idempotent retry, offline history | Offline banner, pending tag, transfer reference | §4.4.5 |
| Accessibility: contrast, text size, focus rings, labels | Settings and every form control | §4.2, §4.4.4 |

## Task sheet

| ID | Task | Auto-completes on (good build) |
| --- | --- | --- |
| T1 | Sign in | Reaching Home |
| T2 | Send PKR 15,000 to Ali Raza | Completed transfer (`sb:tx` kind `transfer`) |
| T3 | Pay the K-Electric bill | Paid bill (`sb:tx` kind `bill`) |
| T4 | Freeze the debit card | `sb:card` setting `freeze`, value true |
| T5 | Find the Foodpanda payment | Searching "foodpanda" in History |

In the bad build only T1 completes automatically; the other tasks are marked
manually so the reason for failure can be recorded.
